/**
 * Canonical site URL for metadata (Open Graph, etc.).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://starrysteps.com).
 * On Vercel, VERCEL_URL is used when the public URL env is unset.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      // fall through
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}
