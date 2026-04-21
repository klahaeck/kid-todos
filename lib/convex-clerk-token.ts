import { auth } from "@clerk/nextjs/server";

/** Clerk JWT template name must be `convex` (Clerk Dashboard → JWT Templates). */
export async function getConvexAuthToken(): Promise<string | null> {
  const a = await auth();
  return a.getToken({ template: "convex" });
}
