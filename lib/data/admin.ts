import { todayInTimezone } from "@/lib/date";
import type { AdminOverviewDTO, AdminUserRowDTO, ChildSectionDTO } from "@/lib/types";
import { listAllProfiles, profileToDTO } from "@/lib/data/profile";
import { childToDTO, listAllChildren } from "@/lib/data/children";
import { listCompletionsForUsersOnDates } from "@/lib/data/completions";
import { listTasksForChildIdsAdmin, taskToDTO } from "@/lib/data/tasks";

export async function buildAdminOverview(): Promise<AdminOverviewDTO> {
  const profiles = await listAllProfiles();
  const allChildren = await listAllChildren();
  const allChildIds = allChildren.map((child) => child._id);
  const childrenByUser = new Map<string, typeof allChildren>();
  for (const ch of allChildren) {
    const list = childrenByUser.get(ch.userId) ?? [];
    list.push(ch);
    childrenByUser.set(ch.userId, list);
  }

  const profileByClerk = new Map(profiles.map((p) => [p.clerkId, p]));

  const clerkIds = new Set<string>();
  for (const p of profiles) clerkIds.add(p.clerkId);
  for (const ch of allChildren) clerkIds.add(ch.userId);

  const userTodaySpecs = [...clerkIds].sort().map((clerkId) => {
    const profileDoc = profileByClerk.get(clerkId) ?? null;
    const tz = profileDoc?.timezone ?? "UTC";
    return {
      clerkId,
      today: todayInTimezone(tz),
      children: (childrenByUser.get(clerkId) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
      profileDoc,
    };
  });

  const [tasksByChild, completionsByUserDate] = await Promise.all([
    listTasksForChildIdsAdmin(allChildIds),
    listCompletionsForUsersOnDates(
      userTodaySpecs.map((spec) => ({
        userId: spec.clerkId,
        date: spec.today,
        childIds: spec.children.map((child) => child._id),
      })),
    ),
  ]);

  const users: AdminUserRowDTO[] = [];

  for (const { clerkId, today, children, profileDoc } of userTodaySpecs) {
    const completions =
      completionsByUserDate.get(`${clerkId}\0${today}`) ?? [];
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
        child: childToDTO(ch),
        tasks: tasks.map(taskToDTO),
        completedTaskIds: [...done],
      });
    }

    users.push({
      clerkId,
      profile: profileDoc ? profileToDTO(profileDoc) : null,
      children: sections,
    });
  }

  return { users };
}

export async function adminDeleteChild(childHexId: string): Promise<boolean> {
  const { ObjectId } = await import("mongodb");
  const childId = new ObjectId(childHexId);
  const { deleteTasksForChild } = await import("@/lib/data/tasks");
  const { deleteCompletionsForChild } = await import("@/lib/data/completions");
  const { getDb, ensureIndexes } = await import("@/lib/mongodb");
  await ensureIndexes();
  const db = await getDb();
  const r = await db.collection("children").deleteOne({ _id: childId });
  if (r.deletedCount !== 1) return false;
  await deleteTasksForChild(childId);
  await deleteCompletionsForChild(childId);
  return true;
}
