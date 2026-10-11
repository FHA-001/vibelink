/**
 * Safe redirect validation helper.
 * Prevents open redirect vulnerabilities while preserving intended navigation destinations.
 */

/**
 * Validates a redirect URL to ensure it's a safe internal path.
 * 
 * Rules:
 * - Must start with exactly one "/"
 * - Must NOT start with "//" (protocol-relative URLs)
 * - Must NOT contain a protocol (http://, https://, javascript:, etc.)
 * - Must be an internal application path
 * 
 * @param redirect - The redirect URL to validate
 * @returns The validated redirect URL, or null if invalid
 */
export function getSafeRedirect(redirect: string | null | undefined): string | null {
  if (!redirect) {
    return null;
  }

  // Must be a string
  if (typeof redirect !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = redirect.trim();

  // Must start with exactly one "/"
  if (!trimmed.startsWith('/')) {
    return null;
  }

  // Must NOT start with "//" (prevents protocol-relative URLs like //evil.example)
  if (trimmed.startsWith('//')) {
    return null;
  }

  // Must NOT contain protocols (http://, https://, javascript:, data:, etc.)
  const protocolPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
  if (protocolPattern.test(trimmed)) {
    return null;
  }

  // Additional safety: ensure no backslash or control characters
  if (/[\x00-\x1F\x7F\\]/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Gets a safe redirect URL with a fallback.
 * 
 * @param redirect - The redirect URL to validate
 * @param fallback - The fallback URL if redirect is invalid
 * @returns The validated redirect URL, or the fallback
 */
export function getSafeRedirectWithFallback(redirect: string | null | undefined, fallback: string): string {
  const safe = getSafeRedirect(redirect);
  return safe || fallback;
}
