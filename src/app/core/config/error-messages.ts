export const GENERIC_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';

export const UNAVAILABLE_MESSAGE =
  'Le service est momentanément indisponible. Veuillez réessayer.';

export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Certains champs sont invalides.',
  EMAIL_ALREADY_USED: 'Cette adresse e-mail est déjà utilisée.',
  DUPLICATE_PHONE: 'Ce numéro de téléphone est déjà utilisé.',
  INVALID_CREDENTIALS: 'E-mail ou mot de passe incorrect.',
  INVALID_REFRESH_TOKEN: 'Votre session a expiré. Veuillez vous reconnecter.',
  USER_SUSPENDED: 'Ce compte est suspendu.',
  WRONG_CURRENT_PASSWORD: 'Le mot de passe actuel est incorrect.',
  SAME_PASSWORD: "Le nouveau mot de passe doit être différent de l'actuel.",
  CONCURRENT_UPDATE: 'La fiche a été modifiée entre-temps.',
  UNAUTHENTICATED: 'Authentification requise.',
  FORBIDDEN: 'Accès refusé.',
  USER_NOT_FOUND: 'Utilisateur introuvable.',
  MALFORMED_REQUEST: 'La requête est illisible.',
  INTERNAL_ERROR: GENERIC_MESSAGE,
  WALLET_NOT_FOUND: 'Aucun portefeuille n’est lié à ce compte.',
  WALLET_ALREADY_EXISTS: 'Un portefeuille existe déjà.',
  ACCOUNT_ALREADY_LINKED: 'Ce compte bancaire est déjà lié à un autre utilisateur.',
  INVALID_LINK_CODE: 'Code de liaison invalide.',
  TOO_MANY_REQUESTS: 'Trop de demandes, réessayez plus tard.',
  BANK_UNAVAILABLE: 'La banque est indisponible. Réessayez plus tard.',
  USER_SERVICE_UNAVAILABLE: 'Le service utilisateur est indisponible. Réessayez plus tard.',
  INVALID_AMOUNT: 'Le montant est invalide.',
  WALLET_NOT_ACTIVE: 'Ce portefeuille est gelé ou clos.',
  IDEMPOTENCY_CONFLICT: 'Cette clé a déjà servi pour un autre montant.',
  TRANSACTION_NOT_FOUND: 'Transaction introuvable.',
  SERVICE_UNAVAILABLE: 'Le portefeuille est injoignable. Réessayez plus tard.',
} as const;

const DETAIL_CODES: ReadonlySet<string> = new Set([
  'INVALID_LINK_CODE',
  'WALLET_ALREADY_EXISTS',
  'TOO_MANY_REQUESTS',
  'WALLET_NOT_FOUND',
]);

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export const FIELD_BY_CODE: Readonly<Record<string, string>> = {
  EMAIL_ALREADY_USED: 'email',
  DUPLICATE_PHONE: 'phone',
  WRONG_CURRENT_PASSWORD: 'currentPassword',
  SAME_PASSWORD: 'newPassword',
};

export function messageForCode(code: string | undefined): string {
  if (code !== undefined && isErrorCode(code)) {
    return ERROR_MESSAGES[code];
  }
  return GENERIC_MESSAGE;
}

export function messageForProblem(code: string | undefined, detail: string | undefined): string {
  if (
    code === 'BANK_UNAVAILABLE' ||
    code === 'USER_SERVICE_UNAVAILABLE' ||
    code === 'SERVICE_UNAVAILABLE'
  ) {
    return messageForCode(code);
  }
  if (code !== undefined && DETAIL_CODES.has(code) && isShortDetail(detail)) {
    return detail.trim();
  }
  return messageForCode(code);
}

function isShortDetail(detail: string | undefined): detail is string {
  if (detail === undefined) {
    return false;
  }
  const text = detail.trim();
  if (text.length === 0 || text.length > 160 || /[\r\n]/.test(text)) {
    return false;
  }
  return !/exception|stacktrace|sql|jdbc/i.test(text);
}

function isErrorCode(code: string): code is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code);
}
