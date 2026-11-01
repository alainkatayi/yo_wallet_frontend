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
} as const;

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

function isErrorCode(code: string): code is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code);
}
