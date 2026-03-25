import { auth, currentUser } from "@clerk/nextjs/server";

export type AppRole = "user" | "admin";

export type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export function roleFromUser(user: ClerkUser | null): AppRole {
  const r = user?.publicMetadata?.role;
  if (r === "admin") return "admin";
  return "user";
}

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function requireAdminUser(): Promise<ClerkUser> {
  const user = await currentUser();
  if (!user || roleFromUser(user) !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}
