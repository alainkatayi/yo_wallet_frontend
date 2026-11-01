import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

let nextDialogId = 0;

@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <button
          type="button"
          class="absolute inset-0 bg-canvas/70"
          aria-label="Fermer"
          (click)="closed.emit()"
        ></button>
        <div
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          class="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card"
        >
          <h2 [id]="titleId" class="text-lg font-semibold text-ink">{{ title() }}</h2>
          <div class="mt-2 text-sm leading-6 text-muted">
            <ng-content />
          </div>
          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <ng-content select="[modalActions]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class Modal {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly closed = output<void>();
  protected readonly titleId = `dialog-title-${++nextDialogId}`;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }
}
