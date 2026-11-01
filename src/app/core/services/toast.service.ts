import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  readonly id: number;
  readonly kind: 'success' | 'error';
  readonly message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<readonly ToastMessage[]>([]);

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastMessage['kind'], message: string): void {
    const id = ++this.nextId;
    this.toasts.update((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => this.dismiss(id), 5000);
  }
}
