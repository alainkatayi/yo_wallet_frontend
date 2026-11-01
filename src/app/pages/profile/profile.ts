import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { Button } from '../../components/ui/button/button';
import { Card } from '../../components/ui/card/card';
import {
  controlActionClass,
  controlIconClass,
  controlPadClass,
} from '../../components/ui/form-field/form-field';
import { FormField } from '../../components/ui/form-field/form-field';
import { Icon } from '../../components/ui/icon/icon';
import { PageHeader } from '../../components/ui/page-header/page-header';
import { Spinner } from '../../components/ui/spinner/spinner';
import { GENERIC_MESSAGE } from '../../core/config/error-messages';
import { isApiError } from '../../core/models/api-error';
import { UserResponse } from '../../core/models/user';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';
import {
  CONFIRM_MESSAGES,
  CURRENT_PASSWORD_MESSAGES,
  FIRST_NAME_MESSAGES,
  LAST_NAME_MESSAGES,
  MISMATCH_MESSAGE,
  PASSWORD_MESSAGES,
  PHONE_MESSAGES,
  SAME_PASSWORD_MESSAGE,
  clearFieldOnChange,
  clientError,
  partitionApiError,
} from '../../core/utils/form-errors';
import {
  passwordChangeGroup,
  passwordValidator,
  personName,
  phoneFormat,
} from '../../core/utils/validators';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeader, Card, FormField, Button, Icon, Spinner],
  templateUrl: './profile.html',
})
export class ProfilePage {
  private readonly forms = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly initialUser = this.auth.user();

  protected readonly user = this.auth.user;
  protected readonly controlPadClass = controlPadClass;
  protected readonly controlIconClass = controlIconClass;
  protected readonly controlActionClass = controlActionClass;
  protected readonly savingProfile = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly profileSubmitted = signal(false);
  protected readonly passwordSubmitted = signal(false);
  protected readonly showCurrent = signal(false);
  protected readonly showNext = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly profileErrors = signal<Readonly<Record<string, string>>>({});
  protected readonly passwordErrors = signal<Readonly<Record<string, string>>>({});
  protected readonly profileError = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);

  protected readonly profileForm = this.forms.group({
    firstName: [this.initialUser?.firstName ?? '', personName],
    lastName: [this.initialUser?.lastName ?? '', personName],
    phone: [this.initialUser?.phone ?? '', phoneFormat],
  });

  protected readonly passwordForm = this.forms.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordChangeGroup },
  );

  constructor() {
    clearFieldOnChange(
      this.profileForm.controls.firstName,
      'firstName',
      this.profileErrors,
      this.profileError,
    );
    clearFieldOnChange(
      this.profileForm.controls.lastName,
      'lastName',
      this.profileErrors,
      this.profileError,
    );
    clearFieldOnChange(this.profileForm.controls.phone, 'phone', this.profileErrors, this.profileError);
    clearFieldOnChange(
      this.passwordForm.controls.currentPassword,
      'currentPassword',
      this.passwordErrors,
      this.passwordError,
    );
    clearFieldOnChange(
      this.passwordForm.controls.newPassword,
      'newPassword',
      this.passwordErrors,
      this.passwordError,
    );
  }

  protected firstNameError(): string | null {
    return (
      this.profileErrors()['firstName'] ??
      clientError(this.profileForm.controls.firstName, this.profileSubmitted(), FIRST_NAME_MESSAGES)
    );
  }

  protected lastNameError(): string | null {
    return (
      this.profileErrors()['lastName'] ??
      clientError(this.profileForm.controls.lastName, this.profileSubmitted(), LAST_NAME_MESSAGES)
    );
  }

  protected phoneError(): string | null {
    return (
      this.profileErrors()['phone'] ??
      clientError(this.profileForm.controls.phone, this.profileSubmitted(), PHONE_MESSAGES)
    );
  }

  protected currentPasswordError(): string | null {
    return (
      this.passwordErrors()['currentPassword'] ??
      clientError(
        this.passwordForm.controls.currentPassword,
        this.passwordSubmitted(),
        CURRENT_PASSWORD_MESSAGES,
      )
    );
  }

  protected newPasswordError(): string | null {
    const server = this.passwordErrors()['newPassword'];
    if (server) {
      return server;
    }
    const client = clientError(
      this.passwordForm.controls.newPassword,
      this.passwordSubmitted(),
      PASSWORD_MESSAGES,
    );
    if (client) {
      return client;
    }
    const visible = this.passwordSubmitted() || this.passwordForm.controls.newPassword.touched;
    if (visible && this.passwordForm.hasError('samePassword')) {
      return SAME_PASSWORD_MESSAGE;
    }
    return null;
  }

  protected confirmError(): string | null {
    const client = clientError(
      this.passwordForm.controls.confirmPassword,
      this.passwordSubmitted(),
      CONFIRM_MESSAGES,
    );
    if (client) {
      return client;
    }
    const visible = this.passwordSubmitted() || this.passwordForm.controls.confirmPassword.touched;
    if (visible && this.passwordForm.hasError('passwordMismatch')) {
      return MISMATCH_MESSAGE;
    }
    return null;
  }

  protected saveProfile(): void {
    this.profileSubmitted.set(true);
    this.profileError.set(null);
    this.profileErrors.set({});
    if (this.profileForm.invalid || this.savingProfile() || this.savingPassword()) {
      return;
    }
    const value = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.users
      .updateProfile(value)
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: (user) => {
          this.auth.setUser(user);
          this.patch(user);
          this.toast.success('Profil mis à jour.');
        },
        error: (error: unknown) => {
          if (isApiError(error) && error.code === 'CONCURRENT_UPDATE') {
            this.toast.error(error.message);
            this.reload();
            return;
          }
          const result = partitionApiError(error, ['firstName', 'lastName', 'phone']);
          this.profileErrors.set(result.fieldErrors);
          this.profileError.set(result.globalMessage);
          if (result.globalMessage) {
            this.toast.error(result.globalMessage);
          }
        },
      });
  }

  protected savePassword(): void {
    this.passwordSubmitted.set(true);
    this.passwordError.set(null);
    this.passwordErrors.set({});
    if (this.passwordForm.invalid || this.savingPassword() || this.savingProfile()) {
      return;
    }
    const value = this.passwordForm.getRawValue();
    this.savingPassword.set(true);
    this.users
      .changePassword({ currentPassword: value.currentPassword, newPassword: value.newPassword })
      .pipe(finalize(() => this.savingPassword.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Mot de passe modifié. Reconnectez-vous.');
          this.auth.logout().subscribe();
        },
        error: (error: unknown) => {
          const result = partitionApiError(error, ['currentPassword', 'newPassword']);
          this.passwordErrors.set(result.fieldErrors);
          this.passwordError.set(result.globalMessage);
          if (result.globalMessage) {
            this.toast.error(result.globalMessage);
          }
        },
      });
  }

  private patch(user: UserResponse): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    });
    this.profileForm.markAsPristine();
  }

  private reload(): void {
    this.users
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.auth.setUser(user);
          this.patch(user);
        },
        error: () => this.toast.error(GENERIC_MESSAGE),
      });
  }
}
