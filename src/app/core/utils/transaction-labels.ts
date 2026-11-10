export function transactionTypeLabel(type: string): string {
  switch (type) {
    case 'TOPUP':
      return 'Recharge';
    case 'WITHDRAW':
      return 'Vers la banque';
    default:
      return 'Opération';
  }
}

export function transactionStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'En cours';
    case 'SUCCESS':
      return 'Réussie';
    case 'FAILED':
      return 'Échouée';
    case 'REVERSED':
      return 'Annulée';
    default:
      return 'Inconnu';
  }
}

export function transactionStatusTone(
  status: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'neutral';
  }
}

const FAILURE_LABELS: Readonly<Record<string, string>> = {
  INSUFFICIENT_FUNDS: 'Solde insuffisant.',
  LIMIT_EXCEEDED: 'Montant hors des limites autorisées.',
  WALLET_FROZEN: 'Portefeuille gelé.',
  WALLET_CLOSED: 'Portefeuille clos.',
  ACCOUNT_BLOCKED: 'Compte bancaire bloqué.',
  ACCOUNT_CLOSED: 'Compte bancaire clos.',
  WALLET_NOT_FOUND: 'Portefeuille introuvable.',
};

export function failureReasonLabel(reason: string | null): string {
  if (reason === null || reason.length === 0) {
    return 'L’opération n’a pas abouti.';
  }
  return FAILURE_LABELS[reason] ?? 'L’opération n’a pas abouti.';
}
