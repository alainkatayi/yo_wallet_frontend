import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Badge } from '../../components/ui/badge/badge';
import { Button } from '../../components/ui/button/button';
import { Card } from '../../components/ui/card/card';
import { controlPadClass } from '../../components/ui/form-field/form-field';
import { FormField } from '../../components/ui/form-field/form-field';
import { Icon } from '../../components/ui/icon/icon';
import { PageHeader } from '../../components/ui/page-header/page-header';
import { Spinner } from '../../components/ui/spinner/spinner';
import { ApiError } from '../../core/models/api-error';
import { WalletResponse } from '../../core/models/wallet';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { WalletService } from '../../core/services/wallet.service';
import { TransactionList } from './transaction-list';
import { WalletOperations } from './wallet-operations';
import { toApiError } from '../../core/utils/api-error';
import {
  formatCountdown,
  formatDateTime,
  fullName,
  walletStatusLabel,
  walletStatusTone,
} from '../../core/utils/format';

type Phase = 'loading' | 'link' | 'code' | 'ready' | 'unavailable';

const ACCOUNT_REQUIRED = 'Le numéro de compte est obligatoire.';
const ACCOUNT_DIGITS = 'Le numéro de compte doit contenir exactement 12 chiffres.';
const CODE_REQUIRED = 'Le code est obligatoire.';
const CODE_DIGITS = 'Le code doit contenir 6 chiffres.';
/** Délai de repli si le navigateur ne peut pas lire Retry-After. */
const FALLBACK_RETRY_SECONDS = 60;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeader,
    Badge,
    Icon,
    Spinner,
    Card,
    FormField,
    Button,
    TransactionList,
    WalletOperations,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly wallets = inject(WalletService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly forms = inject(NonNullableFormBuilder);
  private readonly now = signal(Date.now());
  private readonly expiresAt = signal<number | null>(null);
  private readonly retryUntil = signal<number | null>(null);

  protected readonly controlPadClass = controlPadClass;
  protected readonly user = this.auth.user;
  protected readonly phase = signal<Phase>('loading');
  protected readonly wallet = signal<WalletResponse | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly accountServerError = signal<string | null>(null);
  protected readonly initiateRetry = signal(false);
  protected readonly confirmRetry = signal(false);
  protected readonly pendingAccount = signal('');
  protected readonly linkId = signal<string | null>(null);
  protected readonly activityTick = signal(0);

  protected readonly accountForm = this.forms.group({
    accountNumber: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
  });
  protected readonly codeForm = this.forms.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected readonly name = computed(() => {
    const user = this.user();
    return user ? fullName(user) : '';
  });
  protected readonly walletLabel = computed(() => {
    const wallet = this.wallet();
    return wallet ? walletStatusLabel(wallet.status) : '';
  });
  protected readonly walletTone = computed(() => {
    const wallet = this.wallet();
    return wallet ? walletStatusTone(wallet.status) : 'neutral';
  });
  protected readonly walletCreated = computed(() => {
    const wallet = this.wallet();
    return wallet ? formatDateTime(wallet.createdAt) : '';
  });
  protected readonly codeSeconds = computed(() => remaining(this.expiresAt(), this.now()));
  protected readonly retrySeconds = computed(() => remaining(this.retryUntil(), this.now()));
  protected readonly codeCountdown = computed(() => formatCountdown(this.codeSeconds()));
  protected readonly retryCountdown = computed(() => formatCountdown(this.retrySeconds()));

  constructor() {
    const timer = window.setInterval(() => this.now.set(Date.now()), 1000);
    this.destroyRef.onDestroy(() => window.clearInterval(timer));
    this.accountForm.controls.accountNumber.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.accountServerError.set(null));
    this.load();
  }

  protected refreshAfterMovement(): void {
    this.activityTick.update((value) => value + 1);
    this.wallets
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wallet) => this.showReady(wallet),
      });
  }

  protected load(): void {
    this.phase.set('loading');
    this.formError.set(null);
    this.wallets
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wallet) => this.showReady(wallet),
        error: (error: unknown) => this.onLoadError(error),
      });
  }

  protected initiate(): void {
    if (this.submitting() || this.retrySeconds() > 0) {
      return;
    }
    this.accountServerError.set(null);
    this.formError.set(null);
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    const accountNumber = this.accountForm.controls.accountNumber.value;
    this.submitting.set(true);
    this.wallets
      .initiate(accountNumber)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.pendingAccount.set(accountNumber);
          this.linkId.set(response.linkId);
          this.expiresAt.set(Date.now() + Math.max(0, response.expiresIn) * 1000);
          this.codeForm.reset();
          this.confirmRetry.set(false);
          this.initiateRetry.set(false);
          this.phase.set('code');
        },
        error: (error: unknown) => this.onInitiateError(error),
      });
  }

  protected confirm(): void {
    const linkId = this.linkId();
    if (this.submitting() || linkId === null) {
      return;
    }
    this.formError.set(null);
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }
    const code = this.codeForm.controls.code.value;
    this.submitting.set(true);
    this.wallets
      .confirm(linkId, code)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.codeForm.reset();
          this.linkId.set(null);
          this.showReady(result.wallet);
          this.toast.success(
            result.created
              ? 'Compte bancaire lié.'
              : 'Ce compte était déjà lié à votre portefeuille.',
          );
        },
        error: (error: unknown) => this.onConfirmError(error),
      });
  }

  protected backToAccount(): void {
    this.phase.set('link');
    this.formError.set(null);
    this.confirmRetry.set(false);
    this.codeForm.reset();
    this.linkId.set(null);
  }

  protected accountError(): string | null {
    const server = this.accountServerError();
    if (server !== null) {
      return server;
    }
    const control = this.accountForm.controls.accountNumber;
    if (!control.touched || control.errors === null) {
      return null;
    }
    if (control.hasError('required')) {
      return ACCOUNT_REQUIRED;
    }
    return ACCOUNT_DIGITS;
  }

  protected codeError(): string | null {
    const control = this.codeForm.controls.code;
    if (!control.touched || control.errors === null) {
      return null;
    }
    if (control.hasError('required')) {
      return CODE_REQUIRED;
    }
    return CODE_DIGITS;
  }

  private showReady(wallet: WalletResponse): void {
    this.wallet.set(wallet);
    this.formError.set(null);
    this.phase.set('ready');
  }

  private onLoadError(error: unknown): void {
    const api = toApiError(error);
    if (this.sessionExpired(api)) {
      return;
    }
    if (api.status === 404 && api.code === 'WALLET_NOT_FOUND') {
      this.wallet.set(null);
      this.formError.set(null);
      this.phase.set('link');
      return;
    }
    this.formError.set(api.message);
    this.phase.set('unavailable');
  }

  private onInitiateError(error: unknown): void {
    const api = toApiError(error);
    if (this.sessionExpired(api)) {
      return;
    }
    if (api.code === 'WALLET_ALREADY_EXISTS') {
      this.openExisting();
      return;
    }
    if (api.code === 'VALIDATION_ERROR') {
      this.accountServerError.set(ACCOUNT_DIGITS);
      this.accountForm.controls.accountNumber.markAsTouched();
      return;
    }
    if (api.code === 'TOO_MANY_REQUESTS') {
      this.armRetry(api);
      return;
    }
    this.initiateRetry.set(this.canRetry(api));
    this.formError.set(api.message);
    this.toast.error(api.message);
  }

  private onConfirmError(error: unknown): void {
    const api = toApiError(error);
    if (this.sessionExpired(api)) {
      return;
    }
    if (api.code === 'WALLET_ALREADY_EXISTS') {
      this.openExisting();
      return;
    }
    this.confirmRetry.set(this.canRetry(api));
    this.formError.set(api.message);
    this.toast.error(api.message);
  }

  private openExisting(): void {
    this.phase.set('loading');
    this.wallets
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wallet) => this.showReady(wallet),
        error: (error: unknown) => this.onLoadError(error),
      });
  }

  private armRetry(error: ApiError): void {
    const seconds = error.retryAfterSeconds ?? FALLBACK_RETRY_SECONDS;
    this.retryUntil.set(Date.now() + seconds * 1000);
    this.initiateRetry.set(false);
    this.formError.set(error.message);
    this.toast.error(error.message);
  }

  private sessionExpired(error: ApiError): boolean {
    return error.status === 401 || error.code === 'UNAUTHENTICATED';
  }

  private canRetry(error: ApiError): boolean {
    return (
      error.code === 'BANK_UNAVAILABLE' ||
      error.code === 'USER_SERVICE_UNAVAILABLE' ||
      error.status === 503 ||
      error.status === 0
    );
  }
}

function remaining(until: number | null, now: number): number {
  if (until === null) {
    return 0;
  }
  return Math.max(0, Math.ceil((until - now) / 1000));
}
