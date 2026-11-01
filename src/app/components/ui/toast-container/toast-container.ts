import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div
      class="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-96"
      aria-live="polite"
      aria-label="Notifications"
    >
      @for (toast of toasts(); track toast.id) {
        <article [class]="toastClass(toast.kind)" [attr.role]="toast.kind === 'error' ? 'alert' : 'status'">
          <app-icon [name]="toast.kind === 'success' ? 'check' : 'alert'" [size]="18" />
          <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
          <button
            type="button"
            class="rounded-full p-1 text-current"
            (click)="dismiss(toast.id)"
            aria-label="Fermer la notification"
          >
            <app-icon name="close" [size]="16" />
          </button>
        </article>
      }
    </div>
  `,
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  protected toastClass(kind: 'success' | 'error'): string {
    const tone =
      kind === 'success'
        ? 'border-tertiary/30 bg-tertiary-soft text-tertiary-ink'
        : 'border-danger/30 bg-danger-soft text-danger-ink';
    return `pointer-events-auto flex items-start gap-3 rounded-card border px-4 py-3 shadow-card ${tone}`;
  }
}
