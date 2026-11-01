import { UserResponse } from '../models/user';

const DATE_TIME = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

export function fullName(user: Pick<UserResponse, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function initials(user: Pick<UserResponse, 'firstName' | 'lastName'>): string {
  const value = `${user.firstName.trim().charAt(0)}${user.lastName.trim().charAt(0)}`.toUpperCase();
  return value.length > 0 ? value : 'YM';
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }
  return DATE_TIME.format(date);
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Actif';
    case 'SUSPENDED':
      return 'Suspendu';
    default:
      return 'Inconnu';
  }
}

export function statusTone(status: string): 'success' | 'danger' | 'neutral' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'SUSPENDED':
      return 'danger';
    default:
      return 'neutral';
  }
}
