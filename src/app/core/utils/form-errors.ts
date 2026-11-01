import { WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

import { FIELD_BY_CODE } from '../config/error-messages';
import { GENERIC_MESSAGE } from '../config/error-messages';
import { isApiError } from '../models/api-error';

export const EMAIL_MESSAGES: Readonly<Record<string, string>> = {
  required: "L'adresse e-mail est obligatoire.",
  email: "L'adresse e-mail est invalide.",
  maxlength: "L'adresse e-mail ne doit pas dépasser 150 caractères.",
};

export const PASSWORD_MESSAGES: Readonly<Record<string, string>> = {
  required: 'Le mot de passe est obligatoire.',
  passwordLength: 'Le mot de passe doit contenir entre 8 et 64 caractères.',
  passwordCharset: 'Le mot de passe doit contenir au moins une lettre et un chiffre.',
  passwordBytes: 'Le mot de passe ne doit pas dépasser 72 octets UTF-8.',
};

export const CURRENT_PASSWORD_MESSAGES: Readonly<Record<string, string>> = {
  required: 'Le mot de passe actuel est obligatoire.',
};

export const FIRST_NAME_MESSAGES: Readonly<Record<string, string>> = {
  required: 'Le prénom est obligatoire.',
  maxlength: 'Le prénom ne doit pas dépasser 100 caractères.',
};

export const LAST_NAME_MESSAGES: Readonly<Record<string, string>> = {
  required: 'Le nom est obligatoire.',
  maxlength: 'Le nom ne doit pas dépasser 100 caractères.',
};

export const PHONE_MESSAGES: Readonly<Record<string, string>> = {
  required: 'Le numéro de téléphone est obligatoire.',
  phone: 'Le numéro de téléphone est invalide.',
};

export const CONFIRM_MESSAGES: Readonly<Record<string, string>> = {
  required: 'La confirmation du mot de passe est obligatoire.',
};

export const SAME_PASSWORD_MESSAGE = "Le nouveau mot de passe doit être différent de l'actuel.";

export const MISMATCH_MESSAGE = 'La confirmation ne correspond pas au mot de passe.';

export function clientError(
  control: AbstractControl | null,
  submitted: boolean,
  messages: Readonly<Record<string, string>>,
): string | null {
  if (!control?.errors) {
    return null;
  }
  if (!submitted && !control.touched) {
    return null;
  }
  for (const [key, message] of Object.entries(messages)) {
    if (control.hasError(key)) {
      return message;
    }
  }
  return null;
}

export function clearFieldOnChange(
  control: AbstractControl,
  field: string,
  errors: WritableSignal<Readonly<Record<string, string>>>,
  banner: WritableSignal<string | null>,
): void {
  control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
    banner.set(null);
    errors.update((current) => {
      if (current[field] === undefined) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  });
}

export function partitionApiError(
  error: unknown,
  fields: readonly string[],
): { fieldErrors: Readonly<Record<string, string>>; globalMessage: string | null } {
  if (!isApiError(error)) {
    return { fieldErrors: {}, globalMessage: GENERIC_MESSAGE };
  }
  const fieldErrors: Record<string, string> = {};
  for (const field of fields) {
    const message = error.fieldErrors[field];
    if (message) {
      fieldErrors[field] = message;
    }
  }
  const mapped = FIELD_BY_CODE[error.code];
  if (mapped && fields.includes(mapped) && fieldErrors[mapped] === undefined) {
    fieldErrors[mapped] = error.message;
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, globalMessage: null };
  }
  return { fieldErrors: {}, globalMessage: error.message };
}
