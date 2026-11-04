import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'dashboard'
  | 'user'
  | 'logout'
  | 'mail'
  | 'lock'
  | 'phone'
  | 'eye'
  | 'eye-off'
  | 'menu'
  | 'close'
  | 'shield'
  | 'bolt'
  | 'wallet'
  | 'card'
  | 'activity'
  | 'check'
  | 'alert'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-right';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('dashboard') {
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5 19.5c1.2-3 3.4-4.5 7-4.5s5.8 1.5 7 4.5" />
        }
        @case ('logout') {
          <path d="M9 7V5a2 2 0 0 1 2-2h8v18h-8a2 2 0 0 1-2-2v-2" />
          <path d="M13 12H3" />
          <path d="m6 9-3 3 3 3" />
        }
        @case ('mail') {
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        }
        @case ('lock') {
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        }
        @case ('phone') {
          <rect x="8" y="2.5" width="8" height="19" rx="2" />
          <path d="M11 18.5h2" />
        }
        @case ('eye') {
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        }
        @case ('eye-off') {
          <path d="M3 3 21 21" />
          <path d="M10.6 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8" />
          <path d="M6.1 6.8C3.5 8.7 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.6-.6" />
          <path d="M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5" />
        }
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('close') {
          <path d="M6 6 18 18M18 6 6 18" />
        }
        @case ('shield') {
          <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.8 4.2-1.6 7-4.6 7-8.8V6l-7-3Z" />
        }
        @case ('bolt') {
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
        }
        @case ('wallet') {
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <circle cx="16" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
        }
        @case ('card') {
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        }
        @case ('activity') {
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h10" />
        }
        @case ('arrow-up') {
          <path d="M12 19V5" />
          <path d="m6 11 6-6 6 6" />
        }
        @case ('arrow-down') {
          <path d="M12 5v14" />
          <path d="m6 13 6 6 6-6" />
        }
        @case ('check') {
          <path d="m5 12 5 5 9-10" />
        }
        @case ('alert') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        }
        @case ('arrow-right') {
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
