import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';

import { Badge } from '../../components/ui/badge/badge';
import { Button } from '../../components/ui/button/button';
import { Card } from '../../components/ui/card/card';
import { Modal } from '../../components/ui/modal/modal';
import { Spinner } from '../../components/ui/spinner/spinner';
import { TransactionResponse } from '../../core/models/transaction';
import { TransactionService } from '../../core/services/transaction.service';
import { toApiError } from '../../core/utils/api-error';
import { formatDateTime } from '../../core/utils/format';
import {
  failureReasonLabel,
  transactionStatusLabel,
  transactionStatusTone,
  transactionTypeLabel,
  transferCounterpartyLabel,
} from '../../core/utils/transaction-labels';

@Component({
  selector: 'app-transaction-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, Badge, Button, Modal, Spinner],
  templateUrl: './transaction-list.html',
})
export class TransactionList {
  private readonly transactions = inject(TransactionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loads = new Subject<void>();

  readonly currency = input('CDF');
  readonly reload = input(0);
  /** Nombre de lignes affichées. `null` garde toute la page reçue. */
  readonly limit = input<number | null>(null);

  protected readonly items = signal<readonly TransactionResponse[]>([]);
  protected readonly visible = computed(() => {
    const limit = this.limit();
    const items = this.items();
    return limit === null ? items : items.slice(0, limit);
  });
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly detailOpen = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly detail = signal<TransactionResponse | null>(null);
  protected readonly detailError = signal<string | null>(null);

  constructor() {
    this.loads
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.error.set(null);
          return this.transactions.list().pipe(
            catchError((error: unknown) => {
              this.failList(error);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.items.set(page.items);
        this.loading.set(false);
      });
    toObservable(this.reload)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.loads.next());
  }

  protected reloadList(): void {
    this.loads.next();
  }

  protected openDetail(reference: string): void {
    this.detailOpen.set(true);
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);
    this.transactions
      .one(reference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (transaction) => {
          this.detail.set(transaction);
          this.detailLoading.set(false);
        },
        error: (error: unknown) => {
          const api = toApiError(error);
          this.detailLoading.set(false);
          if (api.status === 401 || api.code === 'UNAUTHENTICATED') {
            return;
          }
          this.detailError.set(api.message);
        },
      });
  }

  protected closeDetail(): void {
    this.detailOpen.set(false);
  }

  protected typeLabel(type: string, direction?: string | null): string {
    return transactionTypeLabel(type, direction);
  }

  protected partyLabel(direction: string | null | undefined): string {
    return transferCounterpartyLabel(direction);
  }

  protected partyLine(item: TransactionResponse): string | null {
    if (item.counterpartyName && item.counterpartyPhone) {
      return `${item.counterpartyName} · ${item.counterpartyPhone}`;
    }
    return item.counterpartyName ?? item.counterpartyPhone;
  }

  protected statusLabel(status: string): string {
    return transactionStatusLabel(status);
  }

  protected statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    return transactionStatusTone(status);
  }

  protected when(value: string): string {
    return formatDateTime(value);
  }

  protected reason(value: string | null): string {
    return failureReasonLabel(value);
  }

  private failList(error: unknown): void {
    const api = toApiError(error);
    this.loading.set(false);
    this.items.set([]);
    if (api.status === 401 || api.code === 'UNAUTHENTICATED') {
      return;
    }
    this.error.set(api.message);
  }
}
