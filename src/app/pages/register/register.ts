import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthLayout } from '../../components/layout/auth-layout/auth-layout';
import { Button } from '../../components/ui/button/button';
import { controlActionClass, controlIconClass, controlPadClass } from '../../components/ui/form-field/form-field';
import { FormField } from '../../components/ui/form-field/form-field';
import { Icon } from '../../components/ui/icon/icon';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  CONFIRM_MESSAGES,
  EMAIL_MESSAGES,
  FIRST_NAME_MESSAGES,
  LAST_NAME_MESSAGES,
  MISMATCH_MESSAGE,
  PASSWORD_MESSAGES,
  PHONE_MESSAGES,
  clearFieldOnChange,
  clientError,
  partitionApiError,
} from '../../core/utils/form-errors';
import {
  confirmPasswordGroup,
  emailFormat,
  passwordValidator,
  personName,
  phoneFormat,
} from '../../core/utils/validators';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, FormField, Button, Icon],
  templateUrl: './register.html',
})
export class RegisterPage {
  private readonly forms = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly controlPadClass = controlPadClass;
  protected readonly controlIconClass = controlIconClass;
  protected readonly controlActionClass = controlActionClass;
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly serverErrors = signal<Readonly<Record<string, string>>>({});
  protected readonly formError = signal<string | null>(null);
  protected readonly form = this.forms.group(
    {
      firstName: ['', personName],
      lastName: ['', personName],
      email: ['', emailFormat],
      phone: ['', phoneFormat],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: confirmPasswordGroup },
  );

  constructor() {
    clearFieldOnChange(this.form.controls.firstName, 'firstName', this.serverErrors, this.formError);
    clearFieldOnChange(this.form.controls.lastName, 'lastName', this.serverErrors, this.formError);
    clearFieldOnChange(this.form.controls.email, 'email', this.serverErrors, this.formError);
    clearFieldOnChange(this.form.controls.phone, 'phone', this.serverErrors, this.formError);
    clearFieldOnChange(this.form.controls.password, 'password', this.serverErrors, this.formError);
  }

  protected firstNameError(): string | null {
    return (
      this.serverErrors()['firstName'] ??
      clientError(this.form.controls.firstName, this.submitted(), FIRST_NAME_MESSAGES)
    );
  }

  protected lastNameError(): string | null {
    return (
      this.serverErrors()['lastName'] ??
      clientError(this.form.controls.lastName, this.submitted(), LAST_NAME_MESSAGES)
    );
  }

  protected emailError(): string | null {
    return (
      this.serverErrors()['email'] ??
      clientError(this.form.controls.email, this.submitted(), EMAIL_MESSAGES)
    );
  }

  protected phoneError(): string | null {
    return (
      this.serverErrors()['phone'] ??
      clientError(this.form.controls.phone, this.submitted(), PHONE_MESSAGES)
    );
  }

  protected passwordError(): string | null {
    return (
      this.serverErrors()['password'] ??
      clientError(this.form.controls.password, this.submitted(), PASSWORD_MESSAGES)
    );
  }

  protected confirmError(): string | null {
    const client = clientError(this.form.controls.confirmPassword, this.submitted(), CONFIRM_MESSAGES);
    if (client) {
      return client;
    }
    const visible = this.submitted() || this.form.controls.confirmPassword.touched;
    if (visible && this.form.hasError('passwordMismatch')) {
      return MISMATCH_MESSAGE;
    }
    return null;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.formError.set(null);
    this.serverErrors.set({});
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.auth
      .register({
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phone: value.phone,
        password: value.password,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Compte créé. Vous pouvez vous connecter.');
          void this.router.navigate(['/connexion']);
        },
        error: (error: unknown) => {
          const result = partitionApiError(error, [
            'firstName',
            'lastName',
            'email',
            'phone',
            'password',
          ]);
          this.serverErrors.set(result.fieldErrors);
          this.formError.set(result.globalMessage);
          if (result.globalMessage) {
            this.toast.error(result.globalMessage);
          }
        },
      });
  }
}
