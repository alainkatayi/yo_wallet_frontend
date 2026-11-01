import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly menuOpen = signal(false);
  readonly logoutOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openLogout(): void {
    this.menuOpen.set(false);
    this.logoutOpen.set(true);
  }

  closeLogout(): void {
    this.logoutOpen.set(false);
  }
}
