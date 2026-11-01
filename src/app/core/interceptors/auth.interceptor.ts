import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { isApiRequest, isPublicAuthRequest } from '../utils/api-url';
import { AUTH_RETRY, SKIP_AUTH_REDIRECT } from './http-context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const outgoing = attachToken(req, auth.accessToken());

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (!shouldRefresh(outgoing, error)) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        catchError((refreshError: unknown) => endSession(auth, router, outgoing, refreshError)),
        switchMap(() => {
          const token = auth.accessToken();
          if (!token) {
            return endSession(auth, router, outgoing, error);
          }
          outgoing.context.set(AUTH_RETRY, true);
          const retried = outgoing.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
          return next(retried).pipe(
            catchError((retryError: unknown) => {
              if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
                return endSession(auth, router, outgoing, retryError);
              }
              return throwError(() => retryError);
            }),
          );
        }),
      );
    }),
  );
};

function attachToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token || !isApiRequest(req.url) || isPublicAuthRequest(req.url)) {
    return req;
  }
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function shouldRefresh(req: HttpRequest<unknown>, error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
    return false;
  }
  if (!isApiRequest(req.url) || isPublicAuthRequest(req.url) || req.context.get(AUTH_RETRY)) {
    return false;
  }
  return true;
}

function endSession(
  auth: AuthService,
  router: Router,
  req: HttpRequest<unknown>,
  error: unknown,
) {
  auth.clearLocalSession();
  if (!req.context.get(SKIP_AUTH_REDIRECT)) {
    void router.navigate(['/connexion']);
  }
  return throwError(() => error);
}
