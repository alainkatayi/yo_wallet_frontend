import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Button } from '../../components/ui/button/button';
import { Card } from '../../components/ui/card/card';
import { PageHeader } from '../../components/ui/page-header/page-header';
import { Spinner } from '../../components/ui/spinner/spinner';
import { WalletResponse } from '../../core/models/wallet';
import { WalletService } from '../../core/services/wallet.service';
import { toApiError } from '../../core/utils/api-error';
import { TransactionList } from '../dashboard/transaction-list';

type Phase = 'loading' | 'ready' | 'missing' | 'unavailable';

@Component({
  selector: 'app-activities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, Card, Button, Spinner, TransactionList],
  templateUrl: './activities.html',
})
export class ActivitiesPage {
  private readonly wallets = inject(WalletService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly phase = signal<Phase>('loading');
  protected readonly wallet = signal<WalletResponse | null>(null);
  protected readonly message = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.phase.set('loading');
    this.message.set(null);
    this.wallets
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wallet) => {
          this.wallet.set(wallet);
          this.phase.set('ready');
        },
        error: (error: unknown) => this.onError(error),
      });
  }

  private onError(error: unknown): void {
    const api = toApiError(error);
    if (api.status === 401 || api.code === 'UNAUTHENTICATED') {
      return;
    }
    if (api.status === 404 && api.code === 'WALLET_NOT_FOUND') {
      this.wallet.set(null);
      this.phase.set('missing');
      return;
    }
    this.message.set(api.message);
    this.phase.set('unavailable');
  }
}
