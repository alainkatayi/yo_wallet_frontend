import { Injectable } from '@angular/core';

import { AuthSession } from '../models/auth';

const ACCESS_KEY = 'yo.accessToken';
const REFRESH_KEY = 'yo.refreshToken';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  // Choix de développement : localStorage. Un cookie HttpOnly serait préférable en production.
  accessToken(): string | null {
    return this.read(ACCESS_KEY);
  }

  refreshToken(): string | null {
    return this.read(REFRESH_KEY);
  }

  save(session: AuthSession): void {
    this.write(ACCESS_KEY, session.accessToken);
    this.write(REFRESH_KEY, session.refreshToken);
  }

  clear(): void {
    this.remove(ACCESS_KEY);
    this.remove(REFRESH_KEY);
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  private remove(key: string): void {
    localStorage.removeItem(key);
  }
}
