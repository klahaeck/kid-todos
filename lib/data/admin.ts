import { fetchMutation, fetchQuery } from "convex/nextjs";
import { todayInTimezone } from "@/lib/date";
import { completionTaskIdToString } from "@/lib/completion-task-id";
import type { AdminOverviewDTO, AdminUserRowDTO, ChildSectionDTO, TaskDTO } from "@/lib/types";
import { listAllProfiles, profileToDTO } from "@/lib/data/profile";
import { childToDTO, listAllChildren } from "@/lib/data/children";
import { listCompletionsForUsersOnDates } from "@/lib/data/completions";
import { api } from "@/convex/_generated/api";
import { getConvexServerSecret } from "@/lib/convex-server-secret";

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

  let tasksByChild = new Map<string, TaskDTO[]>();
  try {
    if (allChildIds.length > 0 && process.env.NEXT_PUBLIC_CONVEX_URL) {
      const secret = getConvexServerSecret();
      const flat = await fetchQuery(api.tasks.adminListForChildIds, {
        secret,
        childIds: allChildIds.map((id) => id.toHexString()),
      });
      for (const t of flat) {
        const list = tasksByChild.get(t.childId) ?? [];
        list.push(t);
        tasksByChild.set(t.childId, list);
      }
    }
  } catch {
    tasksByChild = new Map();
  }

  const completionsByUserDate = await listCompletionsForUsersOnDates(
    userTodaySpecs.map((spec) => ({
      userId: spec.clerkId,
      date: spec.today,
      childIds: spec.children.map((child) => child._id),
    })),
  );

  const users: AdminUserRowDTO[] = [];

  for (const { clerkId, today, children, profileDoc } of userTodaySpecs) {
    const completions =
      completionsByUserDate.get(`${clerkId}\0${today}`) ?? [];
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
        child: childToDTO(ch, profileDoc?.completedTaskIcon),
        tasks,
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
  const { deleteCompletionsForChild } = await import("@/lib/data/completions");
  const { getDb, ensureIndexes } = await import("@/lib/mongodb");
  await ensureIndexes();
  const db = await getDb();
  const r = await db.collection("children").deleteOne({ _id: childId });
  if (r.deletedCount !== 1) return false;
  try {
    if (process.env.NEXT_PUBLIC_CONVEX_URL) {
      const secret = getConvexServerSecret();
      await fetchMutation(api.tasks.adminDeleteAllTasksForChild, {
        secret,
        childId: childHexId,
      });
    }
  } catch {
    /* best-effort */
  }
  await deleteCompletionsForChild(childId);
  return true;
}
