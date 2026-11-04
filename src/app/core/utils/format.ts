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

export function walletStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Actif';
    case 'FROZEN':
      return 'Gelé';
    case 'CLOSED':
      return 'Clos';
    default:
      return 'Inconnu';
  }
}

export function walletStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'FROZEN':
      return 'warning';
    case 'CLOSED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
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
