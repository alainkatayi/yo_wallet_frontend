import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { SKIP_AUTH_REDIRECT } from '../interceptors/http-context';
import { ChangePasswordPayload, UpdateProfilePayload, UserResponse } from '../models/user';
import { normalizePhone } from '../utils/validators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  me(options?: { skipAuthRedirect?: boolean }): Observable<UserResponse> {
    const context = new HttpContext().set(SKIP_AUTH_REDIRECT, options?.skipAuthRedirect ?? false);
    return this.http.get<UserResponse>(`${environment.apiBaseUrl}/api/users/me`, { context });
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${environment.apiBaseUrl}/api/users/me`, {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      phone: normalizePhone(payload.phone),
    });
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http
      .post(`${environment.apiBaseUrl}/api/users/me/password`, payload, { responseType: 'text' })
      .pipe(map(() => undefined));
  }
}
