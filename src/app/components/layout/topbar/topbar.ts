import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { fullName, initials } from '../../../core/utils/format';
import { Icon } from '../../ui/icon/icon';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './topbar.html',
})
export class Topbar {
  private readonly auth = inject(AuthService);
  protected readonly layout = inject(LayoutService);

  protected readonly initials = computed(() => {
    const user = this.auth.user();
    return user ? initials(user) : '';
  });

  protected readonly name = computed(() => {
    const user = this.auth.user();
    return user ? fullName(user) : '';
  });
}
