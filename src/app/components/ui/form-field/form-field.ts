import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export const controlClass =
  'h-12 w-full rounded-control border border-line bg-neutral text-sm text-ink outline-none transition placeholder:text-muted focus:border-tertiary focus:ring-2 focus:ring-tertiary/25 disabled:cursor-not-allowed disabled:opacity-60';

export const controlPadClass = `${controlClass} px-3`;
export const controlIconClass = `${controlClass} pl-11 pr-3`;
export const controlActionClass = `${controlClass} pl-11 pr-11`;

@Component({
  selector: 'app-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-ink" [for]="inputId()">{{ label() }}</label>
      <ng-content />
      @if (error()) {
        <p [id]="errorId()" class="text-sm text-danger-ink" role="alert">{{ error() }}</p>
      } @else if (hint()) {
        <p [id]="hintId()" class="text-sm text-muted">{{ hint() }}</p>
      }
    </div>
  `,
})
export class FormField {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);

  protected errorId(): string {
    return `${this.inputId()}-error`;
  }

  protected hintId(): string {
    return `${this.inputId()}-hint`;
  }
}
