import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Spinner } from '../spinner/spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined' | 'danger' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-secondary',
  secondary: 'bg-neutral text-ink hover:bg-line',
  inverted: 'bg-secondary text-secondary-foreground hover:bg-primary',
  outlined: 'border border-line bg-surface text-ink hover:bg-neutral',
  danger: 'bg-danger text-primary-foreground hover:bg-danger-ink',
  ghost: 'bg-transparent text-muted hover:bg-neutral hover:text-ink',
};

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Spinner],
  host: { class: 'contents' },
  template: `
    <button
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
      [class]="classes()"
    >
      @if (loading()) {
        <app-spinner [size]="16" label="Envoi en cours" />
      }
      <ng-content />
    </button>
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly full = input(false);
  readonly size = input<'md' | 'sm'>('md');

  protected readonly classes = computed(() => {
    const height = this.size() === 'sm' ? 'h-10 px-3' : 'h-12 px-4';
    const width = this.full() ? 'w-full' : '';
    return [
      'inline-flex items-center justify-center gap-2 rounded-control text-sm font-semibold transition',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
      'disabled:cursor-not-allowed disabled:opacity-60',
      height,
      VARIANTS[this.variant()],
      width,
    ].join(' ');
  });
}
