import type { ColorThemeId } from "@/lib/color-themes";
import type { DashboardFontId } from "@/lib/dashboard-font-options";

export type Routine = "morning" | "evening";

export type ProfileDoc = {
  _id: import("mongodb").ObjectId;
  clerkId: string;
  /** UI color theme id; omit on legacy docs → treated as classic */
  colorTheme?: string;
  /** Dashboard font id; omit on legacy docs → treated as geist */
  dashboardFont?: string;
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
  taskId: import("mongodb").ObjectId;
  userId: string;
  date: string;
  completedAt: Date;
};

/** JSON-safe profile for the client */
export type ProfileDTO = {
  id: string;
  clerkId: string;
  colorTheme: ColorThemeId;
  dashboardFont: DashboardFontId;
  timezone: string;
};

export type ChildDTO = {
  id: string;
  userId: string;
  name: string;
  emoji: string | null;
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
