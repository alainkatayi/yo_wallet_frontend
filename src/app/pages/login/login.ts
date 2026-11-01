import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  EMAIL_MESSAGES,
  PASSWORD_MESSAGES,
  clearFieldOnChange,
  clientError,
  partitionApiError,
} from '../../core/utils/form-errors';
import { emailFormat, passwordValidator } from '../../core/utils/validators';
import { AuthLayout } from '../../components/layout/auth-layout/auth-layout';
import { Button } from '../../components/ui/button/button';
import { controlActionClass, controlIconClass } from '../../components/ui/form-field/form-field';
import { FormField } from '../../components/ui/form-field/form-field';
import { Icon } from '../../components/ui/icon/icon';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, FormField, Button, Icon],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly forms = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly controlIconClass = controlIconClass;
  protected readonly controlActionClass = controlActionClass;
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly serverErrors = signal<Readonly<Record<string, string>>>({});
  protected readonly formError = signal<string | null>(null);
  protected readonly form = this.forms.group({
    email: ['', emailFormat],
    password: ['', [Validators.required, passwordValidator]],
  });

  constructor() {
    clearFieldOnChange(this.form.controls.email, 'email', this.serverErrors, this.formError);
    clearFieldOnChange(this.form.controls.password, 'password', this.serverErrors, this.formError);
  }

  protected emailError(): string | null {
    return (
      this.serverErrors()['email'] ??
      clientError(this.form.controls.email, this.submitted(), EMAIL_MESSAGES)
    );
  }

  protected passwordError(): string | null {
    return (
      this.serverErrors()['password'] ??
      clientError(this.form.controls.password, this.submitted(), PASSWORD_MESSAGES)
    );
  }

  protected submit(): void {
    this.submitted.set(true);
    this.formError.set(null);
    this.serverErrors.set({});
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.auth
      .login(email, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/tableau-de-bord']);
        },
        error: (error: unknown) => this.show(error),
      });
  }

  private show(error: unknown): void {
    const result = partitionApiError(error, ['email', 'password']);
    this.serverErrors.set(result.fieldErrors);
    this.formError.set(result.globalMessage);
    if (result.globalMessage) {
      this.toast.error(result.globalMessage);
    }
  }
}
