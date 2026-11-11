import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { GENERIC_MESSAGE } from '../config/error-messages';
import { ApiError } from '../models/api-error';
import {
  SubmittedTransaction,
  TransactionPage,
  TransactionResponse,
  TransactionType,
  TransferPreview,
} from '../models/transaction';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);

  submit(type: TransactionType, amount: string, idempotencyKey: string): Observable<SubmittedTransaction> {
    const path = type === 'TOPUP' ? 'topup' : 'withdraw';
    return this.http
      .post<unknown>(`${environment.apiBaseUrl}/api/transactions/${path}`, { amount }, {
        headers: { 'Idempotency-Key': idempotencyKey },
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          httpStatus: response.status,
          transaction: readTransaction(response.body),
        })),
      );
  }

  previewTransfer(recipientPhone: string, amount: string): Observable<TransferPreview> {
    return this.http
      .post<unknown>(`${environment.apiBaseUrl}/api/transactions/transfer/preview`, {
        recipientPhone,
        amount,
      })
      .pipe(map((body) => readPreview(body)));
  }

  transfer(recipientPhone: string, amount: string, idempotencyKey: string): Observable<SubmittedTransaction> {
    return this.http
      .post<unknown>(
        `${environment.apiBaseUrl}/api/transactions/transfer`,
        { recipientPhone, amount },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
          observe: 'response',
        },
      )
      .pipe(
        map((response) => ({
          httpStatus: response.status,
          transaction: readTransaction(response.body),
        })),
      );
  }

  list(): Observable<TransactionPage> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/api/transactions`, {
        params: { page: '0', size: '20' },
      })
      .pipe(map((body) => readPage(body)));
  }

  one(reference: string): Observable<TransactionResponse> {
    return this.http
      .get<unknown>(
        `${environment.apiBaseUrl}/api/transactions/${encodeURIComponent(reference)}`,
      )
      .pipe(map((body) => readTransaction(body)));
  }
}

function readPage(value: unknown): TransactionPage {
  const record = asRecord(value);
  const items = record?.['items'];
  if (record === null || !Array.isArray(items)) {
    throw new ApiError(0, 'UNKNOWN', GENERIC_MESSAGE, {});
  }
  return {
    items: items.map((item) => readTransaction(item)),
    page: readCount(record['page']),
    size: readCount(record['size']),
    totalItems: readCount(record['totalItems']),
  };
}

function readPreview(value: unknown): TransferPreview {
  const record = asRecord(value);
  const firstName = record?.['firstName'];
  const lastName = record?.['lastName'];
  const phone = record?.['phone'];
  const amount = record?.['amount'];
  if (
    record === null ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof phone !== 'string' ||
    typeof amount !== 'string'
  ) {
    throw new ApiError(0, 'UNKNOWN', GENERIC_MESSAGE, {});
  }
  return { firstName, lastName, phone, amount };
}

function readTransaction(value: unknown): TransactionResponse {
  const record = asRecord(value);
  const reference = record?.['reference'];
  const type = record?.['type'];
  const amount = record?.['amount'];
  const fee = record?.['fee'];
  const status = record?.['status'];
  const createdAt = record?.['createdAt'];
  const updatedAt = record?.['updatedAt'];
  if (
    record === null ||
    typeof reference !== 'string' ||
    typeof type !== 'string' ||
    typeof amount !== 'string' ||
    typeof fee !== 'string' ||
    typeof status !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof updatedAt !== 'string'
  ) {
    throw new ApiError(0, 'UNKNOWN', GENERIC_MESSAGE, {});
  }
  const directionRaw = readNullableString(record['direction']);
  const direction = directionRaw === 'IN' || directionRaw === 'OUT' ? directionRaw : null;
  return {
    reference,
    type,
    direction,
    amount,
    fee,
    status,
    failureReason: readNullableString(record['failureReason']),
    bankAccount: readNullableString(record['bankAccount']),
    counterpartyPhone: readNullableString(record['counterpartyPhone']),
    counterpartyName: readNullableString(record['counterpartyName']),
    createdAt,
    updatedAt,
  };
}

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === 'string' ? value : null;
}

function readCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}
