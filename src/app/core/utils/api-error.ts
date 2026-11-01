import { HttpErrorResponse } from '@angular/common/http';

import { GENERIC_MESSAGE, messageForCode, UNAVAILABLE_MESSAGE } from '../config/error-messages';
import { ApiError } from '../models/api-error';

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (!(error instanceof HttpErrorResponse)) {
    return new ApiError(0, 'UNKNOWN', GENERIC_MESSAGE, {});
  }
  if (error.status === 0 || error.status === 503) {
    return new ApiError(error.status, 'UNAVAILABLE', UNAVAILABLE_MESSAGE, {});
  }
  if (error.status >= 500) {
    return new ApiError(error.status, 'INTERNAL_ERROR', GENERIC_MESSAGE, {});
  }
  const body = readBody(error.error);
  const code = body?.code;
  const fieldErrors = code === 'VALIDATION_ERROR' ? readFieldErrors(body?.errors) : {};
  return new ApiError(error.status, code ?? 'UNKNOWN', messageForCode(code), fieldErrors);
}

function readBody(value: unknown): { code?: string; errors?: unknown } | null {
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const code = typeof record['code'] === 'string' ? record['code'] : undefined;
  return { code, errors: record['errors'] };
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
