import { HttpContextToken } from '@angular/common/http';

/** La requête a déjà été rejouée après un refresh. */
export const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

/** Ne pas rediriger vers la connexion si le refresh échoue (démarrage de session). */
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);
