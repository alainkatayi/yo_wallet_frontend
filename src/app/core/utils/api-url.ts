import { environment } from '../config/environment';

const PUBLIC_AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
] as const;

export function isApiRequest(url: string): boolean {
  return (
    matchesBase(url, environment.apiBaseUrl) ||
    matchesBase(url, environment.walletBaseUrl) ||
    matchesBase(url, environment.transactionBaseUrl)
  );
}

function matchesBase(url: string, base: string): boolean {
  return url === base || url.startsWith(`${base}/`);
}

export function isPublicAuthRequest(url: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => {
    const target = `${environment.apiBaseUrl}${path}`;
    return url === target || url.startsWith(`${target}?`);
  });
}
