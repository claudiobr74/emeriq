/**
 * Full document navigation after logout / 401.
 * router.push would keep clinical state in memory.
 */
export function hardRedirectToLogin(): void {
  const dest = `${window.location.origin}/login`;
  // Full reload is required to drop in-memory consultation state.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = dest;
}
