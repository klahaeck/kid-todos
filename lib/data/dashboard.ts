import { ObjectId } from "mongodb";
import { todayInTimezone } from "@/lib/date";
import type { ChildSectionDTO, DashboardDTO } from "@/lib/types";
import { childToDTO, listChildrenForUser } from "@/lib/data/children";
import { listCompletionsForDay } from "@/lib/data/completions";
import { ensureProfileForClerkUser, profileToDTO } from "@/lib/data/profile";
import { listTasksForUserChildren, taskToDTO } from "@/lib/data/tasks";

export async function buildDashboardForUser(
  clerkId: string,
): Promise<DashboardDTO> {
  const profile = await ensureProfileForClerkUser(clerkId);
  const today = todayInTimezone(profile.timezone);
  const children = await listChildrenForUser(clerkId);
  const childIds = children.map((ch) => ch._id);
  const [completions, tasksByChild] = await Promise.all([
    listCompletionsForDay(clerkId, today, childIds),
    listTasksForUserChildren(clerkId, childIds),
  ]);
  const byChild = new Map<string, Set<string>>();
  for (const comp of completions) {
    const key = comp.childId.toHexString();
    if (!byChild.has(key)) byChild.set(key, new Set());
    byChild.get(key)!.add(comp.taskId.toHexString());
  }

  const sections: ChildSectionDTO[] = [];
  for (const ch of children) {
    const tasks = tasksByChild.get(ch._id.toHexString()) ?? [];
    const done = byChild.get(ch._id.toHexString()) ?? new Set();
    sections.push({
      child: childToDTO(ch, profile.completedTaskIcon),
      tasks: tasks.map(taskToDTO),
      completedTaskIds: [...done],
    });
  }

  return {
    profile: profileToDTO(profile),
    today,
    children: sections,
  };
}

export async function deleteChildCascade(
  userId: string,
  childId: ObjectId,
): Promise<boolean> {
  const { deleteChildForUser } = await import("@/lib/data/children");
  const { deleteTasksForChild } = await import("@/lib/data/tasks");
  const { deleteCompletionsForChild } = await import("@/lib/data/completions");
  const ok = await deleteChildForUser(userId, childId);
  if (!ok) return false;
  await deleteTasksForChild(childId);
  await deleteCompletionsForChild(childId);
  return true;
}
