import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section class="rounded-card bg-surface p-5 shadow-card sm:p-6">
      @if (title()) {
        <header class="mb-5">
          <h2 class="text-lg font-semibold text-ink">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="mt-1 text-sm text-muted">{{ subtitle() }}</p>
          }
        </header>
      }
      <ng-content />
    </section>
  `,
})
export class Card {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
}
