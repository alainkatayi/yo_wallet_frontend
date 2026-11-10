import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Subject, finalize, interval, switchMap, takeUntil } from 'rxjs';

import { Button } from '../../components/ui/button/button';
import { Icon } from '../../components/ui/icon/icon';
import { controlActionClass, controlPadClass } from '../../components/ui/form-field/form-field';
import { FormField } from '../../components/ui/form-field/form-field';
import { Modal } from '../../components/ui/modal/modal';
import { Spinner } from '../../components/ui/spinner/spinner';
import { ApiError } from '../../core/models/api-error';
import { TransactionResponse, TransactionType } from '../../core/models/transaction';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';
import { normalizeAmount } from '../../core/utils/amount';
import { toApiError } from '../../core/utils/api-error';
import { failureReasonLabel, transactionTypeLabel } from '../../core/utils/transaction-labels';

type Step = 'form' | 'password' | 'pending' | 'result';

const POLL_MS = 3000;
const POLL_LIMIT_MS = 120_000;
const AMOUNT_REQUIRED = 'Le montant est obligatoire.';
const AMOUNT_INVALID = 'Saisissez un montant supérieur à 0, avec au plus 2 décimales.';
const PASSWORD_REQUIRED = 'Le mot de passe est obligatoire.';
const PASSWORD_WRONG = 'Mot de passe incorrect.';
const KEY_INVALID = 'La clé d’idempotence est absente ou invalide.';

interface HeldKey {
  readonly amount: string;
  readonly key: string;
}

@Component({
  selector: 'app-wallet-operations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Icon, FormField, Modal, Spinner],
  host: { class: 'block' },
  templateUrl: './wallet-operations.html',
})
export class WalletOperations {
  private readonly transactions = inject(TransactionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly forms = inject(NonNullableFormBuilder);
  private readonly stopPoll = new Subject<void>();
  private pollTimer: number | null = null;
  private readonly keys = new Map<TransactionType, HeldKey>();
  private readonly pendingByType = new Map<TransactionType, TransactionResponse>();

  readonly currency = input('CDF');
  /** `topup` n’affiche que la recharge. `all` affiche aussi l’envoi vers la banque. */
  readonly mode = input<'all' | 'topup'>('all');
  readonly balanceChanged = output<void>();
  readonly activityChanged = output<void>();

  protected readonly controlPadClass = controlPadClass;
  protected readonly controlActionClass = controlActionClass;
  protected readonly modalOpen = signal(false);
  protected readonly type = signal<TransactionType>('TOPUP');
  protected readonly step = signal<Step>('form');
  protected readonly showPassword = signal(false);
  protected readonly preparedAmount = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly polling = signal(false);
  protected readonly timedOut = signal(false);
  protected readonly retryable = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly outcome = signal<TransactionResponse | null>(null);
  protected readonly form = this.forms.group({
    amount: ['', [Validators.required, amountControl]],
  });
  protected readonly passwordForm = this.forms.group({
    password: ['', Validators.required],
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.stopPolling());
    this.form.controls.amount.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.formError.set(null);
      this.retryable.set(false);
    });
    this.passwordForm.controls.password.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.formError.set(null);
      const control = this.passwordForm.controls.password;
      if (control.hasError('credentials')) {
        control.setErrors(null);
      }
    });
  }

  protected open(type: TransactionType): void {
    this.type.set(type);
    this.formError.set(null);
    this.retryable.set(false);
    this.timedOut.set(false);
    const pending = this.pendingByType.get(type);
    if (pending) {
      this.outcome.set(pending);
      this.step.set('pending');
      this.modalOpen.set(true);
      if (!this.polling()) {
        this.watch(pending.reference);
      }
      return;
    }
    this.outcome.set(null);
    this.step.set('form');
    this.resetEntry();
    this.modalOpen.set(true);
  }

  protected close(): void {
    if (this.polling() && !this.timedOut()) {
      return;
    }
    this.stopPolling();
    this.modalOpen.set(false);
    this.step.set('form');
    this.formError.set(null);
    this.resetEntry();
  }

  protected continue(): void {
    if (this.submitting()) {
      return;
    }
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const amount = normalizeAmount(this.form.controls.amount.value);
    if (amount === null) {
      this.form.controls.amount.markAsTouched();
      return;
    }
    this.preparedAmount.set(amount);
    this.passwordForm.reset();
    this.showPassword.set(false);
    this.retryable.set(false);
    this.step.set('password');
  }

  protected backToAmount(): void {
    if (this.submitting()) {
      return;
    }
    this.passwordForm.reset();
    this.showPassword.set(false);
    this.formError.set(null);
    this.retryable.set(false);
    this.step.set('form');
  }

  protected confirm(): void {
    const type = this.type();
    const amount = this.preparedAmount();
    if (this.submitting() || this.polling() || this.pendingByType.has(type) || amount === null) {
      return;
    }
    this.formError.set(null);
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const password = this.passwordForm.controls.password.value;
    const key = this.keyFor(type, amount);
    this.submitting.set(true);
    this.auth
      .confirmPassword(password)
      .pipe(
        switchMap(() => {
          this.passwordForm.reset();
          return this.transactions.submit(type, amount, key);
        }),
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.onSubmitted(result.transaction),
        error: (error: unknown) => this.onConfirmError(error),
      });
  }

  protected passwordError(): string | null {
    const control = this.passwordForm.controls.password;
    if (!control.touched || control.errors === null) {
      return null;
    }
    if (control.hasError('required') || control.value.length === 0) {
      return PASSWORD_REQUIRED;
    }
    if (control.hasError('credentials')) {
      return PASSWORD_WRONG;
    }
    return null;
  }

  protected amountError(): string | null {
    const control = this.form.controls.amount;
    if (!control.touched || control.errors === null) {
      return null;
    }
    if (control.hasError('required') || control.value.trim() === '') {
      return AMOUNT_REQUIRED;
    }
    return AMOUNT_INVALID;
  }

  protected title(): string {
    return this.type() === 'TOPUP' ? 'Recharger' : 'Vers la banque';
  }

  protected actionLabel(): string {
    if (this.retryable()) {
      return 'Réessayer';
    }
    return this.type() === 'TOPUP' ? 'Recharger' : 'Envoyer vers la banque';
  }

  protected typeLabel(): string {
    return transactionTypeLabel(this.type());
  }

  protected resultText(): string {
    const tx = this.outcome();
    if (tx === null) {
      return '';
    }
    if (tx.status === 'SUCCESS') {
      return this.type() === 'TOPUP' ? 'Recharge effectuée.' : 'Envoyé vers votre compte bancaire.';
    }
    if (tx.status === 'FAILED' || tx.status === 'REVERSED') {
      return failureReasonLabel(tx.failureReason);
    }
    return 'Opération en cours.';
  }

  private onSubmitted(tx: TransactionResponse): void {
    this.outcome.set(tx);
    this.retryable.set(false);
    if (tx.status === 'PENDING') {
      this.pendingByType.set(this.type(), tx);
      this.step.set('pending');
      this.timedOut.set(false);
      this.activityChanged.emit();
      this.watch(tx.reference);
      return;
    }
    this.finish(tx);
  }

  private onConfirmError(error: unknown): void {
    const api = toApiError(error);
    if (api.code === 'INVALID_CREDENTIALS') {
      this.passwordForm.reset();
      this.passwordForm.controls.password.setErrors({ credentials: true });
      this.passwordForm.controls.password.markAsTouched();
      this.step.set('password');
      return;
    }
    this.onSubmitError(error);
  }

  private onSubmitError(error: unknown): void {
    const api = toApiError(error);
    if (this.sessionExpired(api)) {
      return;
    }
    if (api.code === 'VALIDATION_ERROR') {
      this.formError.set(KEY_INVALID);
      return;
    }
    if (api.code === 'INVALID_AMOUNT') {
      this.form.controls.amount.setErrors({ amount: true });
      this.form.controls.amount.markAsTouched();
      return;
    }
    this.retryable.set(this.canRetry(api));
    this.formError.set(api.message);
    if (api.code === 'WALLET_NOT_FOUND' || api.code === 'WALLET_NOT_ACTIVE') {
      this.balanceChanged.emit();
    }
  }

  private watch(reference: string): void {
    this.stopPolling();
    this.polling.set(true);
    this.timedOut.set(false);
    const started = Date.now();
    this.pollTimer = window.setTimeout(() => this.keepPending(), POLL_LIMIT_MS);
    interval(POLL_MS)
      .pipe(
        takeUntil(this.stopPoll),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.transactions.one(reference)),
      )
      .subscribe({
        next: (tx) => this.onPolled(tx, started),
        error: (error: unknown) => this.onPollError(error),
      });
  }

  private onPolled(tx: TransactionResponse, started: number): void {
    this.outcome.set(tx);
    this.pendingByType.set(this.type(), tx);
    if (tx.status === 'PENDING') {
      if (Date.now() - started >= POLL_LIMIT_MS) {
        this.keepPending();
      }
      return;
    }
    this.stopPolling();
    this.polling.set(false);
    this.finish(tx);
  }

  private onPollError(error: unknown): void {
    const api = toApiError(error);
    this.stopPolling();
    this.polling.set(false);
    this.timedOut.set(true);
    if (this.sessionExpired(api)) {
      return;
    }
    if (api.code === 'TRANSACTION_NOT_FOUND') {
      this.pendingByType.delete(this.type());
      this.step.set('result');
    }
    this.formError.set(api.message);
  }

  private keepPending(): void {
    if (this.step() === 'result') {
      return;
    }
    this.stopPolling();
    this.polling.set(false);
    this.timedOut.set(true);
    this.step.set('pending');
    this.activityChanged.emit();
  }

  private finish(tx: TransactionResponse): void {
    const type = this.type();
    this.pendingByType.delete(type);
    this.keys.delete(type);
    this.outcome.set(tx);
    this.step.set('result');
    this.balanceChanged.emit();
    this.activityChanged.emit();
    if (tx.status === 'SUCCESS') {
      this.toast.success(type === 'TOPUP' ? 'Recharge effectuée.' : 'Envoyé vers votre compte bancaire.');
    }
  }

  private keyFor(type: TransactionType, amount: string): string {
    const held = this.keys.get(type);
    if (held && held.amount === amount) {
      return held.key;
    }
    const key = crypto.randomUUID();
    this.keys.set(type, { amount, key });
    return key;
  }

  private resetEntry(): void {
    this.form.reset();
    this.passwordForm.reset();
    this.showPassword.set(false);
    this.preparedAmount.set(null);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      window.clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.stopPoll.next();
  }

  private canRetry(error: ApiError): boolean {
    return error.code === 'SERVICE_UNAVAILABLE' || error.status === 503 || error.status === 0;
  }

  private sessionExpired(error: ApiError): boolean {
    return error.status === 401 || error.code === 'UNAUTHENTICATED';
  }
}

function amountControl(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return normalizeAmount(value) === null ? { amount: true } : null;
}
