export function getConvexServerSecret(): string {
  const s = process.env.CONVEX_SERVER_SECRET?.trim();
  if (!s) {
    throw new Error("Missing CONVEX_SERVER_SECRET");
  }
  return s;
}
