import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { Button } from '../../ui/button/button';
import { Modal } from '../../ui/modal/modal';
import { LayoutService } from '../layout.service';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Sidebar, Topbar, Modal, Button],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly auth = inject(AuthService);
  protected readonly layout = inject(LayoutService);
  protected readonly loggingOut = signal(false);

  protected cancelLogout(): void {
    if (this.loggingOut()) {
      return;
    }
    this.layout.closeLogout();
  }

  protected logout(): void {
    if (this.loggingOut()) {
      return;
    }
    this.loggingOut.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe();
  }
}
