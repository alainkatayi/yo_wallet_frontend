import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const PHONE_PATTERN = /^\+[1-9][0-9]{7,14}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '');
}

export const emailFormat: ValidatorFn = (control) => {
  const value = stringValue(control).trim().toLowerCase();
  if (value.length === 0) {
    return { required: true };
  }
  if (value.length > 150) {
    return { maxlength: true };
  }
  if (!EMAIL_PATTERN.test(value)) {
    return { email: true };
  }
  return null;
};

export const passwordValidator: ValidatorFn = (control) => {
  const value = stringValue(control);
  if (value.length === 0) {
    return null;
  }
  if (value.length < 8 || value.length > 64) {
    return { passwordLength: true };
  }
  if (new TextEncoder().encode(value).length > 72) {
    return { passwordBytes: true };
  }
  let letter = false;
  let digit = false;
  for (const char of value) {
    if (/\p{L}/u.test(char)) {
      letter = true;
    }
    if (char >= '0' && char <= '9') {
      digit = true;
    }
  }
  if (!letter || !digit) {
    return { passwordCharset: true };
  }
  return null;
};

export const personName: ValidatorFn = (control) => {
  const value = stringValue(control).trim();
  if (value.length === 0) {
    return { required: true };
  }
  if (value.length > 100) {
    return { maxlength: true };
  }
  return null;
};

export const phoneFormat: ValidatorFn = (control) => {
  const value = stringValue(control);
  if (value.trim().length === 0) {
    return { required: true };
  }
  if (!PHONE_PATTERN.test(normalizePhone(value))) {
    return { phone: true };
  }
  return null;
};

export const confirmPasswordGroup: ValidatorFn = (control) => {
  const password = stringValue(control.get('password'));
  const confirm = stringValue(control.get('confirmPassword'));
  if (password.length === 0 || confirm.length === 0 || password === confirm) {
    return null;
  }
  return { passwordMismatch: true };
};

export const passwordChangeGroup: ValidatorFn = (control) => {
  const current = stringValue(control.get('currentPassword'));
  const next = stringValue(control.get('newPassword'));
  const confirm = stringValue(control.get('confirmPassword'));
  const errors: ValidationErrors = {};
  if (current.length > 0 && next.length > 0 && current === next) {
    errors['samePassword'] = true;
  }
  if (confirm.length > 0 && next.length > 0 && confirm !== next) {
    errors['passwordMismatch'] = true;
  }
  return Object.keys(errors).length > 0 ? errors : null;
};

function stringValue(control: AbstractControl | null): string {
  if (!control) {
    return '';
  }
  const value: unknown = control.value;
  return typeof value === 'string' ? value : '';
}
