import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { environment } from '../config/environment';
import { ERROR_MESSAGES, GENERIC_MESSAGE } from '../config/error-messages';
import { ApiError } from '../models/api-error';
import { AuthSession, RegisterPayload } from '../models/auth';
import { UserResponse } from '../models/user';
import { TokenStorage } from '../utils/token-storage';
import { normalizePhone } from '../utils/validators';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly users = inject(UserService);
  private readonly storage = inject(TokenStorage);
  private readonly router = inject(Router);
  private refreshInFlight: Observable<AuthSession> | null = null;

  readonly user = signal<UserResponse | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);

  accessToken(): string | null {
    return this.storage.accessToken();
  }

  setUser(user: UserResponse): void {
    this.user.set(user);
  }

  restoreSession(): Promise<void> {
    if (!this.storage.accessToken() && !this.storage.refreshToken()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.users
        .me({ skipAuthRedirect: true })
        .pipe(
          tap((user) => this.user.set(user)),
          catchError(() => {
            this.clearLocalSession();
            return of(null);
          }),
        )
        .subscribe({
          next: () => resolve(),
          error: () => resolve(),
        });
    });
  }

  login(email: string, password: string): Observable<UserResponse> {
    return this.http
      .post<AuthSession>(`${environment.apiBaseUrl}/api/auth/login`, {
        email: email.trim(),
        password,
      })
      .pipe(
        tap((session) => {
          this.assertSession(session);
          this.storage.save(session);
        }),
        switchMap(() => this.users.me()),
        tap((user) => this.user.set(user)),
        catchError((error: unknown) => {
          this.clearLocalSession();
          return throwError(() => error);
        }),
      );
  }

  register(payload: RegisterPayload): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${environment.apiBaseUrl}/api/auth/register`, {
      email: payload.email.trim(),
      password: payload.password,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      phone: normalizePhone(payload.phone),
    });
  }

  /**
   * Un seul refresh à la fois : les requêtes concurrentes attendent le même appel.
   */
  refresh(): Observable<AuthSession> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const refreshToken = this.storage.refreshToken();
    if (!refreshToken) {
      return throwError(
        () => new ApiError(401, 'UNAUTHENTICATED', ERROR_MESSAGES.UNAUTHENTICATED, {}),
      );
    }
    const request$ = this.http
      .post<AuthSession>(`${environment.apiBaseUrl}/api/auth/refresh`, { refreshToken })
      .pipe(
        tap((session) => {
          this.assertSession(session);
          this.storage.save(session);
        }),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.refreshInFlight = request$;
    return request$;
  }

  logout(): Observable<void> {
    const refreshToken = this.storage.refreshToken();
    const request$ = refreshToken
      ? this.http
          .post(
            `${environment.apiBaseUrl}/api/auth/logout`,
            { refreshToken },
            { responseType: 'text' },
          )
          .pipe(
            map(() => undefined),
            catchError(() => of(undefined)),
          )
      : of(undefined);

    return request$.pipe(
      finalize(() => {
        this.clearLocalSession();
        void this.router.navigate(['/connexion']);
      }),
    );
  }

  clearLocalSession(): void {
    this.storage.clear();
    this.user.set(null);
  }

  private assertSession(session: AuthSession): void {
    if (
      typeof session.accessToken !== 'string' ||
      session.accessToken.length === 0 ||
      typeof session.refreshToken !== 'string' ||
      session.refreshToken.length === 0
    ) {
      throw new ApiError(0, 'INTERNAL_ERROR', GENERIC_MESSAGE, {});
    }
  }
}
