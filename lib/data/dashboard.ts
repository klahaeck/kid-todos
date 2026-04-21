import { ObjectId } from "mongodb";
import { fetchQuery } from "convex/nextjs";
import { todayInTimezone } from "@/lib/date";
import { completionTaskIdToString } from "@/lib/completion-task-id";
import type { ChildSectionDTO, DashboardDTO, TaskDTO } from "@/lib/types";
import { childToDTO, listChildrenForUser } from "@/lib/data/children";
import { listCompletionsForDay } from "@/lib/data/completions";
import { ensureProfileForClerkUser, profileToDTO } from "@/lib/data/profile";
import { api } from "@/convex/_generated/api";

export async function buildDashboardForUser(
  clerkId: string,
  options?: { convexToken: string | null },
): Promise<DashboardDTO> {
  const profile = await ensureProfileForClerkUser(clerkId);
  const today = todayInTimezone(profile.timezone);
  const children = await listChildrenForUser(clerkId);
  const childHexIds = children.map((ch) => ch._id.toHexString());
  const childIds = children.map((ch) => ch._id);
  const completions = await listCompletionsForDay(clerkId, today, childIds);

  let flatTasks: TaskDTO[] = [];
  const token = options?.convexToken;
  if (token && process.env.NEXT_PUBLIC_CONVEX_URL) {
    try {
      flatTasks = await fetchQuery(
        api.tasks.listForOwner,
        { ownerUserId: clerkId, childIds: childHexIds },
        { token },
      );
    } catch {
      flatTasks = [];
    }
  }

  const tasksByChild = new Map<string, TaskDTO[]>();
  for (const t of flatTasks) {
    const list = tasksByChild.get(t.childId) ?? [];
    list.push(t);
    tasksByChild.set(t.childId, list);
  }

  const byChild = new Map<string, Set<string>>();
  for (const comp of completions) {
    const key = comp.childId.toHexString();
    if (!byChild.has(key)) byChild.set(key, new Set());
    byChild.get(key)!.add(completionTaskIdToString(comp.taskId));
  }

  const sections: ChildSectionDTO[] = [];
  for (const ch of children) {
    const tasks = tasksByChild.get(ch._id.toHexString()) ?? [];
    const done = byChild.get(ch._id.toHexString()) ?? new Set();
    sections.push({
      child: childToDTO(ch, profile.completedTaskIcon),
      tasks,
      completedTaskIds: [...done],
    });
  }

  return {
    dataOwnerId: clerkId,
    profile: profileToDTO(profile),
    today,
    children: sections,
  };
}

export async function deleteChildCascade(
  userId: string,
  childId: ObjectId,
  options?: { convexToken: string | null },
): Promise<boolean> {
  const { deleteChildForUser } = await import("@/lib/data/children");
  const { deleteCompletionsForChild } = await import("@/lib/data/completions");
  const { fetchMutation } = await import("convex/nextjs");
  const { api } = await import("@/convex/_generated/api");
  const ok = await deleteChildForUser(userId, childId);
  if (!ok) return false;
  const token = options?.convexToken;
  if (token && process.env.NEXT_PUBLIC_CONVEX_URL) {
    try {
      await fetchMutation(
        api.tasks.deleteAllForChild,
        { ownerUserId: userId, childId: childId.toHexString() },
        { token },
      );
    } catch {
      /* Convex delete best-effort; child is already removed from Mongo */
    }
  }
  await deleteCompletionsForChild(childId);
  return true;
}
