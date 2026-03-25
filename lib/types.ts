import type { ColorThemeId } from "@/lib/color-themes";

export type Routine = "morning" | "evening";

export type ProfileDoc = {
  _id: import("mongodb").ObjectId;
  clerkId: string;
  /** UI color theme id; omit on legacy docs → treated as classic */
  colorTheme?: string;
  timezone: string;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ChildDoc = {
  _id: import("mongodb").ObjectId;
  userId: string;
  name: string;
  sortOrder: number;
  morningStart: string | null;
  morningEnd: string | null;
  eveningStart: string | null;
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
  timezone: string;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
};

export type ChildDTO = {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  morningStart: string | null;
  morningEnd: string | null;
  eveningStart: string | null;
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
