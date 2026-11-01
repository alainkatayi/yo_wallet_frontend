import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Badge } from '../../components/ui/badge/badge';
import { Icon } from '../../components/ui/icon/icon';
import { PageHeader } from '../../components/ui/page-header/page-header';
import { Spinner } from '../../components/ui/spinner/spinner';
import { AuthService } from '../../core/services/auth.service';
import { formatDateTime, fullName, statusLabel, statusTone } from '../../core/utils/format';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, Badge, Icon, Spinner],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
  protected readonly name = computed(() => {
    const user = this.user();
    return user ? fullName(user) : '';
  });
  protected readonly createdAt = computed(() => {
    const user = this.user();
    return user ? formatDateTime(user.createdAt) : '';
  });
  protected readonly statusLabel = computed(() => {
    const user = this.user();
    return user ? statusLabel(user.status) : '';
  });
  protected readonly statusTone = computed(() => {
    const user = this.user();
    return user ? statusTone(user.status) : 'neutral';
  });
}
