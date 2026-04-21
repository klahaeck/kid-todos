import type { ColorThemeId } from "@/lib/color-themes";
import type { CompletedTaskIconId } from "@/lib/completed-task-icon-options";
import type { DashboardFontId } from "@/lib/dashboard-font-options";

export type Routine = "morning" | "evening";

export type ProfileDoc = {
  _id: import("mongodb").ObjectId;
  clerkId: string;
  /** UI color theme id; omit on legacy docs → treated as classic */
  colorTheme?: string;
  /** Dashboard font id; omit on legacy docs → treated as geist */
  dashboardFont?: string;
  /** Legacy account-level done icon; child docs override via `completedTaskIcon` */
  completedTaskIcon?: string;
  timezone: string;
  /** @deprecated Legacy routine windows; ignored by the app */
  morningStart?: string;
  morningEnd?: string;
  eveningStart?: string;
  eveningEnd?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ChildDoc = {
  _id: import("mongodb").ObjectId;
  userId: string;
  name: string;
  emoji?: string | null;
  /** Done-marker on dashboard tasks; omit → use profile fallback or default check */
  completedTaskIcon?: string | null;
  sortOrder: number;
  hiddenOnDashboard?: boolean;
  morningStart: string | null;
  /** @deprecated Ignored; morning ends at a fixed time */
  morningEnd: string | null;
  eveningStart: string | null;
  /** @deprecated Ignored; evening ends at a fixed time */
  eveningEnd: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskDoc = {
  _id: import("mongodb").ObjectId;
  childId: import("mongodb").ObjectId;
  userId: string;
  title: string;
  routine: Routine;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CompletionDoc = {
  _id: import("mongodb").ObjectId;
  childId: import("mongodb").ObjectId;
  /** Convex task id (string) or legacy Mongo ObjectId */
  taskId: string | import("mongodb").ObjectId;
  userId: string;
  /** Calendar date YYYY-MM-DD in the user’s timezone when completed */
  date: string;
  /** UTC instant when the task was marked done for `date` */
  completedAt: Date;
  /** Snapshot when recorded; omit on legacy docs */
  routine?: Routine;
  /** Slugified task title at completion time; omit on legacy docs */
  titleSlug?: string;
};

/** Append-only log each time a task is marked complete (toggle on). */
export type TaskCompletionEventDoc = {
  _id: import("mongodb").ObjectId;
  userId: string;
  childId: import("mongodb").ObjectId;
  taskId: string | import("mongodb").ObjectId;
  titleSlug: string;
  routine: Routine;
  calendarDate: string;
  completedAt: Date;
};

/** JSON-safe profile for the client */
export type ProfileDTO = {
  id: string;
  clerkId: string;
  colorTheme: ColorThemeId;
  dashboardFont: DashboardFontId;
  completedTaskIcon: CompletedTaskIconId;
  timezone: string;
};

export type ChildDTO = {
  id: string;
  userId: string;
  name: string;
  emoji: string | null;
  completedTaskIcon: CompletedTaskIconId;
  sortOrder: number;
  hiddenOnDashboard: boolean;
  morningStart: string | null;
  /** Legacy; always null in API responses */
  morningEnd: string | null;
  eveningStart: string | null;
  /** Legacy; always null in API responses */
  eveningEnd: string | null;
};

export type TaskDTO = {
  id: string;
  childId: string;
  userId: string;
  title: string;
  routine: Routine;
  sortOrder: number;
  active: boolean;
};

export type ChildSectionDTO = {
  child: ChildDTO;
  tasks: TaskDTO[];
  completedTaskIds: string[];
};

export type DashboardDTO = {
  /** Clerk id of the Mongo/Convex data owner (primary or self when not in a household). */
  dataOwnerId: string;
  profile: ProfileDTO;
  today: string;
  children: ChildSectionDTO[];
};

export type AdminUserRowDTO = {
  clerkId: string;
  profile: ProfileDTO | null;
  children: ChildSectionDTO[];
};

export type AdminOverviewDTO = {
  users: AdminUserRowDTO[];
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Household collaborator (not the billing primary). */
export type HouseholdMemberDoc = {
  _id: import("mongodb").ObjectId;
  ownerClerkId: string;
  memberClerkId: string;
  joinedAt: Date;
};

export type HouseholdInviteDoc = {
  _id: import("mongodb").ObjectId;
  token: string;
  ownerClerkId: string;
  emailNormalized: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  redeemedAt?: Date | null;
  /** Set when Resend fails so ops can retry */
  emailFailedAt?: Date | null;
};

export type HouseholdMemberDTO = {
  memberClerkId: string;
  joinedAt: string;
};

export type HouseholdInvitePendingDTO = {
  id: string;
  emailNormalized: string;
  createdAt: string;
  expiresAt: string;
};

export type HouseholdOverviewDTO = {
  role: "primary" | "member";
  /** Set when role is member */
  ownerClerkId?: string;
  members: HouseholdMemberDTO[];
  pendingInvites: HouseholdInvitePendingDTO[];
};

/**
 * Snapshot of Clerk `auth().has()` for the billing primary, so household
 * members can read the same entitlements without a Clerk session for the owner.
 */
export type HouseholdEntitlementsDoc = {
  _id: import("mongodb").ObjectId;
  ownerClerkId: string;
  isMonthlySubscriber: boolean;
  hasMultipleChildrenFeature: boolean;
  hasAllRoutinesFeature: boolean;
  hasAllThemesFeature: boolean;
  hasMultipleUsersFeature: boolean;
  updatedAt: Date;
};
