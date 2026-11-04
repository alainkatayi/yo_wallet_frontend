import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Badge } from '../../components/ui/badge/badge';
import { Button } from '../../components/ui/button/button';
import { Card } from '../../components/ui/card/card';
import { Icon } from '../../components/ui/icon/icon';
import { PageHeader } from '../../components/ui/page-header/page-header';
import { Spinner } from '../../components/ui/spinner/spinner';
import { WalletResponse } from '../../core/models/wallet';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { toApiError } from '../../core/utils/api-error';
import { formatDateTime, fullName, walletStatusLabel, walletStatusTone } from '../../core/utils/format';
import { WalletOperations } from '../dashboard/wallet-operations';

type Phase = 'loading' | 'ready' | 'missing' | 'unavailable';

@Component({
  selector: 'app-wallet-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, Card, Badge, Button, Icon, Spinner, WalletOperations],
  templateUrl: './wallet.html',
})
export class WalletPage {
  private readonly auth = inject(AuthService);
  private readonly wallets = inject(WalletService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly user = this.auth.user;
  protected readonly phase = signal<Phase>('loading');
  protected readonly wallet = signal<WalletResponse | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly holder = computed(() => {
    const user = this.user();
    return user ? fullName(user) : '';
  });
  protected readonly openedAt = computed(() => {
    const wallet = this.wallet();
    return wallet ? formatDateTime(wallet.createdAt) : '';
  });
  protected readonly statusLabel = computed(() => {
    const wallet = this.wallet();
    return wallet ? walletStatusLabel(wallet.status) : '';
  });
  protected readonly statusTone = computed(() => {
    const wallet = this.wallet();
    return wallet ? walletStatusTone(wallet.status) : 'neutral';
  });

  constructor() {
    this.load();
  }

  protected reloadWallet(): void {
    this.wallets
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wallet) => this.wallet.set(wallet),
        error: (error: unknown) => this.onError(error),
      });
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
