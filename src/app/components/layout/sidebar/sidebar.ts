import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Icon, IconName } from '../../ui/icon/icon';
import { LayoutService } from '../layout.service';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  host: { class: 'contents' },
  templateUrl: './sidebar.html',
})
export class Sidebar {
  protected readonly layout = inject(LayoutService);
  protected readonly items: readonly NavItem[] = [
    { path: '/tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/portefeuille', label: 'Wallet', icon: 'wallet' },
    { path: '/compte-bancaire', label: 'Compte bancaire', icon: 'card' },
    { path: '/activites', label: 'Activités', icon: 'activity' },
    { path: '/profil', label: 'Profil', icon: 'user' },
  ];

  protected itemClass(active: boolean): string {
    const tone = active
      ? 'bg-nav text-primary-foreground'
      : 'text-primary-muted hover:bg-secondary hover:text-primary-foreground';
    return `flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition ${tone}`;
  }
}
