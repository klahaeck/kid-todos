import { redirect } from "next/navigation";

export default function RoutinesPage() {
  redirect("/settings?tab=routines");
}
