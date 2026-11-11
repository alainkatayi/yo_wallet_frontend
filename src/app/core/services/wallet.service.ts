import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { GENERIC_MESSAGE } from '../config/error-messages';
import { ApiError } from '../models/api-error';
import { InitiateLinkResponse, WalletResponse } from '../models/wallet';

export interface ConfirmedWallet {
  readonly wallet: WalletResponse;
  readonly created: boolean;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly http = inject(HttpClient);

  me(): Observable<WalletResponse> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/api/wallets/me`)
      .pipe(map((body) => readWallet(body)));
  }

  initiate(accountNumber: string): Observable<InitiateLinkResponse> {
    return this.http
      .post<unknown>(`${environment.apiBaseUrl}/api/wallets/link/initiate`, { accountNumber })
      .pipe(map((body) => readInitiation(body)));
  }

  confirm(linkId: string, code: string): Observable<ConfirmedWallet> {
    return this.http
      .post<unknown>(
        `${environment.apiBaseUrl}/api/wallets/link/confirm`,
        { linkId, code },
        { observe: 'response' },
      )
      .pipe(
        map((response) => ({
          wallet: readWallet(response.body),
          created: response.status === 201,
        })),
      );
  }
}

function readWallet(value: unknown): WalletResponse {
  const record = asRecord(value);
  const walletId = record?.['walletId'];
  const balance = record?.['balance'];
  const currency = record?.['currency'];
  const status = record?.['status'];
  const createdAt = record?.['createdAt'];
  const accountNumber = record?.['accountNumber'];
  if (
    typeof walletId !== 'string' ||
    typeof balance !== 'string' ||
    typeof currency !== 'string' ||
    typeof status !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof accountNumber !== 'string'
  ) {
    throw new ApiError(0, 'UNKNOWN', GENERIC_MESSAGE, {});
  }
  return { walletId, balance, currency, status, createdAt, accountNumber };
}

function readInitiation(value: unknown): InitiateLinkResponse {
  const record = asRecord(value);
  const linkId = record?.['linkId'];
  const expiresIn = record?.['expiresIn'];
  if (typeof linkId !== 'string' || linkId.length === 0 || typeof expiresIn !== 'number' || !Number.isFinite(expiresIn)) {
    throw new ApiError(0, 'UNKNOWN', GENERIC_MESSAGE, {});
  }
  return { linkId, expiresIn };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}
