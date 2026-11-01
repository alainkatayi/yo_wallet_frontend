export type UserStatus = 'ACTIVE' | 'SUSPENDED';

/** Corps JSON de UserResponse. */
export interface UserResponse {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly status: UserStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpdateProfilePayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
}

export interface ChangePasswordPayload {
  readonly currentPassword: string;
  readonly newPassword: string;
}
