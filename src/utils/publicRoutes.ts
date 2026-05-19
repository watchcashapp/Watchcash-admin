/** Routes that do not require login and never use the admin dashboard shell. */
export const NO_AUTH_PUBLIC_PREFIXES = [
  '/pages/how-to-delete-account',
  '/billing/success',
  '/billing/cancel',
] as const;

/** Legal pages: guests see public layout; logged-in admins may use the dashboard shell to edit. */
export const PUBLIC_LEGAL_PREFIXES = [
  '/pages/privacy-policy',
  '/pages/terms-and-conditions',
] as const;

export function matchesRoutePrefix(
  pathname: string | null | undefined,
  prefixes: readonly string[]
): boolean {
  if (!pathname) return false;
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isNoAuthPublicRoute(pathname: string | null | undefined): boolean {
  return matchesRoutePrefix(pathname, NO_AUTH_PUBLIC_PREFIXES);
}

export function isPublicLegalRoute(pathname: string | null | undefined): boolean {
  return matchesRoutePrefix(pathname, PUBLIC_LEGAL_PREFIXES);
}

/** Skip login redirect / profile gate (guest-accessible pages). */
export function isPublicGuestRoute(pathname: string | null | undefined): boolean {
  return isNoAuthPublicRoute(pathname) || isPublicLegalRoute(pathname);
}
