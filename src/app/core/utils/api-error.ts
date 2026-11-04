import { HttpErrorResponse } from '@angular/common/http';

import { GENERIC_MESSAGE, messageForProblem, UNAVAILABLE_MESSAGE } from '../config/error-messages';
import { ApiError } from '../models/api-error';

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (!(error instanceof HttpErrorResponse)) {
    return new ApiError(0, 'UNKNOWN', GENERIC_MESSAGE, {});
  }
  if (error.status === 0) {
    return new ApiError(0, 'UNAVAILABLE', UNAVAILABLE_MESSAGE, {});
  }
  const body = readBody(error.error);
  const code = body?.code;
  const retryAfterSeconds = readRetryAfter(error);
  if (code === 'BANK_UNAVAILABLE' || code === 'USER_SERVICE_UNAVAILABLE' || code === 'SERVICE_UNAVAILABLE') {
    return new ApiError(error.status, code, messageForProblem(code, undefined), {}, retryAfterSeconds);
  }
  if (error.status === 503) {
    return new ApiError(error.status, code ?? 'UNAVAILABLE', UNAVAILABLE_MESSAGE, {}, retryAfterSeconds);
  }
  if (error.status >= 500) {
    return new ApiError(error.status, 'INTERNAL_ERROR', GENERIC_MESSAGE, {});
  }
  const fieldErrors = code === 'VALIDATION_ERROR' ? readFieldErrors(body?.errors) : {};
  return new ApiError(
    error.status,
    code ?? 'UNKNOWN',
    messageForProblem(code, body?.detail),
    fieldErrors,
    retryAfterSeconds,
  );
}

function readBody(value: unknown): { code?: string; detail?: string; errors?: unknown } | null {
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const code = typeof record['code'] === 'string' ? record['code'] : undefined;
  const detail = typeof record['detail'] === 'string' ? record['detail'] : undefined;
  return { code, detail, errors: record['errors'] };
}

function readRetryAfter(error: HttpErrorResponse): number | null {
  const raw = error.headers.get('Retry-After')?.trim();
  if (raw === undefined || raw.length === 0) {
    return null;
  }
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }
  const at = Date.parse(raw);
  if (Number.isNaN(at)) {
    return null;
  }
  return Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function readFieldErrors(value: unknown): Record<string, string> {
  if (!Array.isArray(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const field = record['field'];
    const message = record['message'];
    if (
      typeof field === 'string' &&
      field.length > 0 &&
      typeof message === 'string' &&
      message.length > 0 &&
      result[field] === undefined
    ) {
      result[field] = message;
    }
  }
  return result;
}
