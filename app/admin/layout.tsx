import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { roleFromUser } from "@/lib/authz";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (roleFromUser(user) !== "admin") {
    redirect("/dashboard");
  }
  return children;
}
