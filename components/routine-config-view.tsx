"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { Eye, EyeOff, GripVertical, Smile } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatTimeHmForLocaleInProfileZone } from "@/lib/format-time-hm";
import {
  DEFAULT_CHILD_EVENING_START,
  DEFAULT_CHILD_MORNING_START,
} from "@/lib/routine-filter";
import { mergeHmOptions } from "@/lib/time-hm-options";
import { getDashboardData } from "@/app/actions/dashboard";
import {
  createChildAction,
  deleteChildAction,
  reorderChildrenAction,
  updateChildAction,
} from "@/app/actions/children";
import {
  createTaskAction,
  deleteTaskAction,
  reorderTasksAction,
  updateTaskAction,
} from "@/app/actions/tasks";
import { CompletedTaskIconGraphic } from "@/components/completed-task-icon-graphic";
import {
  COMPLETED_TASK_ICON_OPTIONS,
  type CompletedTaskIconId,
  normalizeCompletedTaskIcon,
} from "@/lib/completed-task-icon-options";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ChildSectionDTO,
  DashboardDTO,
  ProfileDTO,
  Routine,
  TaskDTO,
} from "@/lib/types";
import {
  resolveRoutineFilter,
  type RoutineTab,
} from "@/lib/routine-filter";

const ROUTINE_WHEN_SELECT_ITEMS = [
  { value: "morning" as const, label: "Morning" },
  { value: "evening" as const, label: "Evening" },
];

const CHILD_EMOJI_OPTIONS = [
  "😀",
  "😎",
  "🥳",
  "🤖",
  "🦄",
  "🐱",
  "🐶",
  "🦊",
  "🐼",
  "🦖",
  "🧸",
  "⚽",
] as const;

const MORE_CHILD_EMOJI_OPTIONS = [
  "🌟",
  "🚀",
  "🎨",
  "🎵",
  "🧩",
  "🛴",
  "🦁",
  "🐯",
  "🐨",
  "🐸",
  "🐢",
  "🐬",
  "🌈",
  "🪐",
  "🦋",
  "🐝",
  "🐧",
  "🦉",
  "🐙",
  "🦄",
  "🐰",
  "🐹",
  "🐻",
  "🐵",
  "🦓",
  "🦒",
  "🦕",
  "🦖",
  "🐞",
  "🌸",
  "🌼",
  "🍀",
  "🌺",
  "🌻",
  "🌙",
  "☀️",
  "⭐",
  "⚡",
  "❄️",
  "🔥",
  "💧",
  "🍎",
  "🍓",
  "🍉",
  "🍌",
  "🥕",
  "🍪",
  "🧁",
  "🍿",
  "⚽",
  "🏀",
  "🏈",
  "⚾",
  "🎾",
  "🏐",
  "🥇",
  "🏆",
  "🎯",
  "🎲",
  "🪁",
  "🛼",
  "🚲",
  "🛹",
  "🚂",
  "✈️",
  "🚁",
  "🚒",
  "🏰",
  "🗺️",
  "⛺",
  "🎪",
  "🎭",
  "🎬",
  "🎤",
  "🎸",
  "🥁",
  "📚",
  "✏️",
  "🧪",
  "🔬",
  "💡",
  "🛸",
  "🤠",
  "👑",
  "🦸",
  "🧙",
  "🧚",
  "🧜",
  "🐉",
  "🪄",
  "❤️",
  "💙",
  "💚",
  "💜",
  "🧡",
  "🤍",
  "🖤",
  "🤎",
] as const;

type RoutineConfigViewProps = {
  hasMultipleChildrenFeature?: boolean;
  hasAllRoutinesFeature?: boolean;
  showBillingLinks?: boolean;
};

export function RoutineConfigView({
  hasMultipleChildrenFeature = false,
  hasAllRoutinesFeature = false,
  showBillingLinks = true,
}: RoutineConfigViewProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RoutineTab>("all");
  const [childDialog, setChildDialog] = useState<"none" | "add" | "upgrade">(
    "none",
  );
  const [morningRoutinesTipOpen, setMorningRoutinesTipOpen] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildEmoji, setNewChildEmoji] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [routineDrafts, setRoutineDrafts] = useState<
    Record<string, "morning" | "evening">
  >({});

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const r = await getDashboardData();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });

  const addChildMut = useMutation({
    mutationFn: async (vars: { name: string; emoji?: string }) => {
      const r = await createChildAction(vars);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      setNewChildName("");
      setNewChildEmoji("");
      setChildDialog("none");
      invalidate();
    },
  });

  const addTaskMut = useMutation({
    mutationFn: async (vars: {
      childId: string;
      title: string;
      routine: Routine;
    }) => {
      const r = await createTaskAction(vars);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: (_data, variables) => {
      invalidate();
      if (!hasAllRoutinesFeature && variables.routine === "morning") {
        setMorningRoutinesTipOpen(true);
      }
    },
  });

  const delChildMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await deleteChildAction(id);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  const updateChildMut = useMutation({
    mutationFn: async (vars: {
      id: string;
      emoji?: string | null;
      hiddenOnDashboard?: boolean;
      completedTaskIcon?: CompletedTaskIconId;
    }) => {
      const r = await updateChildAction(vars);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onMutate: async (vars) => {
      if (vars.completedTaskIcon === undefined) return {};
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });
      const previousDashboard = queryClient.getQueryData<DashboardDTO>(
        queryKeys.dashboard,
      );
      queryClient.setQueryData<DashboardDTO>(queryKeys.dashboard, (current) =>
        current
          ? {
              ...current,
              children: current.children.map((section) =>
                section.child.id !== vars.id
                  ? section
                  : {
                      ...section,
                      child: {
                        ...section.child,
                        completedTaskIcon: vars.completedTaskIcon!,
                      },
                    },
              ),
            }
          : current,
      );
      return { previousDashboard };
    },
    onError: (_err, vars, context) => {
      const prev = (
        context as { previousDashboard?: DashboardDTO } | undefined
      )?.previousDashboard;
      if (vars.completedTaskIcon !== undefined && prev) {
        queryClient.setQueryData(queryKeys.dashboard, prev);
      }
    },
    onSettled: () => invalidate(),
  });

  const updateChildTimesMut = useMutation({
    mutationFn: async (vars: {
      id: string;
      morningStart?: string | null;
      eveningStart?: string | null;
    }) => {
      const r = await updateChildAction(vars);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  const delTaskMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await deleteTaskAction(id);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  const updateTaskMut = useMutation({
    mutationFn: async (vars: { id: string; title: string }) => {
      const r = await updateTaskAction(vars);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onMutate: (vars) => {
      void queryClient.cancelQueries({ queryKey: queryKeys.dashboard });
      const previousDashboard = queryClient.getQueryData<DashboardDTO>(
        queryKeys.dashboard,
      );

      queryClient.setQueryData<DashboardDTO>(queryKeys.dashboard, (current) => {
        if (!current) return current;
        const nextTitle = vars.title.trim();
        if (!nextTitle) return current;

        return {
          ...current,
          children: current.children.map((section) => ({
            ...section,
            tasks: section.tasks.map((task) =>
              task.id === vars.id ? { ...task, title: nextTitle } : task,
            ),
          })),
        };
      });

      return { previousDashboard };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard);
      }
    },
    onSettled: () => invalidate(),
  });

  const reorderMut = useMutation({
    mutationFn: async (vars: {
      childId: string;
      routine: Routine;
      orderedIds: string[];
    }) => {
      const r = await reorderTasksAction(vars);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onMutate: (vars) => {
      void queryClient.cancelQueries({ queryKey: queryKeys.dashboard });
      const previousDashboard = queryClient.getQueryData<DashboardDTO>(
        queryKeys.dashboard,
      );

      queryClient.setQueryData<DashboardDTO>(queryKeys.dashboard, (current) => {
        if (!current) return current;

        return {
          ...current,
          children: current.children.map((section) => {
            if (section.child.id !== vars.childId) return section;

            const orderLookup = new Map(
              vars.orderedIds.map((id, index) => [id, index] as const),
            );

            const tasks = [...section.tasks].sort((a, b) => {
              if (a.routine !== b.routine) {
                return a.routine === "morning" ? -1 : 1;
              }

              if (a.routine !== vars.routine) {
                if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
                return a.title.localeCompare(b.title);
              }

              const aIndex = orderLookup.get(a.id);
              const bIndex = orderLookup.get(b.id);

              if (aIndex !== undefined && bIndex !== undefined) {
                return aIndex - bIndex;
              }
              if (aIndex !== undefined) return -1;
              if (bIndex !== undefined) return 1;

              if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
              return a.title.localeCompare(b.title);
            });

            return { ...section, tasks };
          }),
        };
      });

      return { previousDashboard };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard);
      }
    },
    onSettled: () => invalidate(),
  });

  const data = dashboardQuery.data;

  const reorderChildrenMut = useMutation({
    mutationFn: async (vars: { orderedIds: string[] }) => {
      const r = await reorderChildrenAction(vars);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });
      const previousDashboard = queryClient.getQueryData<DashboardDTO>(
        queryKeys.dashboard,
      );

      queryClient.setQueryData<DashboardDTO>(queryKeys.dashboard, (current) => {
        if (!current) return current;

        const byId = new Map(current.children.map((section) => [section.child.id, section]));
        const reorderedChildren = vars.orderedIds
          .map((id) => byId.get(id))
          .filter((section): section is ChildSectionDTO => Boolean(section));

        if (reorderedChildren.length === 0) return current;

        return {
          ...current,
          children: reorderedChildren,
        };
      });

      return { previousDashboard };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard);
      }
    },
    onSettled: () => invalidate(),
  });

  const childSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function onChildrenDragEnd(event: DragEndEvent) {
    if (reorderChildrenMut.isPending) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!data) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const visibleChildren = hasMultipleChildrenFeature
      ? data.children
      : data.children.slice(0, 1);
    const oldIndex = visibleChildren.findIndex((s) => s.child.id === activeId);
    const newIndex = visibleChildren.findIndex((s) => s.child.id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const orderedIds = arrayMove(visibleChildren, oldIndex, newIndex).map(
      (section) => section.child.id,
    );
    reorderChildrenMut.mutate({ orderedIds });
  }

  const tabButtons: { id: RoutineTab; label: string }[] = [
    { id: "auto", label: "Now" },
    { id: "morning", label: "Morning" },
    { id: "evening", label: "Evening" },
    { id: "all", label: "All" },
  ];

  if (dashboardQuery.isLoading) {
    return <p className="p-6 text-muted-foreground">Loading routines…</p>;
  }

  if (dashboardQuery.isError || !data) {
    return (
      <p className="p-6 text-red-600">
        {dashboardQuery.error instanceof Error
          ? dashboardQuery.error.message
          : "Something went wrong"}
      </p>
    );
  }

  const canAddAnotherChild =
    data.children.length === 0 || hasMultipleChildrenFeature;
  const visibleChildren = hasMultipleChildrenFeature
    ? data.children
    : data.children.slice(0, 1);
  const hasHiddenChildren =
    !hasMultipleChildrenFeature && data.children.length > visibleChildren.length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Routine setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add children and tasks here. Kids use the{" "}
          <Link
            href="/dashboard"
            className="font-medium text-brand-grape underline hover:text-brand-grape/85"
          >
            dashboard
          </Link>{" "}
          to tap tasks when they finish them.
        </p>
        {!hasAllRoutinesFeature ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Morning tasks you add here are saved, but on the free plan they do
            not appear on the kids dashboard until your subscription includes the{" "}
            <span className="font-medium text-foreground">all_routines</span>{" "}
            feature. Evening tasks show as usual.
          </p>
        ) : null}
        {/* <p className="mt-1 text-sm text-muted-foreground">
          Preview uses calendar day{" "}
          <span className="font-medium text-foreground">{data.today}</span>{" "}
          ({data.profile.timezone?.trim() || "UTC"}).
        </p> */}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {tabButtons.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setTab(b.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === b.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (canAddAnotherChild) {
              setChildDialog("add");
            } else {
              setChildDialog("upgrade");
            }
          }}
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add child
        </button>
      </div>
      {hasHiddenChildren ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Only one child is shown on your current plan. Tap Add child to learn how
          to add more.
        </p>
      ) : null}

      <Dialog.Root
        open={childDialog !== "none"}
        onOpenChange={(open) => {
          if (!open) {
            setChildDialog("none");
            setNewChildName("");
            setNewChildEmoji("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-[opacity,backdrop-filter] duration-150 supports-backdrop-filter:backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg outline-none">
              {childDialog === "upgrade" ? (
                <>
                  <Dialog.Title className="text-lg font-semibold">
                    Upgrade to add another child
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    Your plan includes one child. To create and manage routines
                    for more than one child, upgrade to a paid account.
                  </Dialog.Description>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <Dialog.Close
                      type="button"
                      className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      Close
                    </Dialog.Close>
                    {showBillingLinks ? (
                      <Link
                        href="/upgrade"
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      >
                        View plans & upgrade
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Ask the primary account holder to upgrade the household
                        plan.
                      </p>
                    )}
                    <Link
                      href="/settings"
                      className="text-center text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground sm:text-left"
                    >
                      Account & settings
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Dialog.Title className="text-lg font-semibold">
                    Add a child
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    Enter their name to create morning and evening checklists.
                  </Dialog.Description>
                  <form
                    className="mt-4 flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const n = newChildName.trim();
                      const emoji = newChildEmoji.trim();
                      if (n && canAddAnotherChild) {
                        addChildMut.mutate({
                          name: n,
                          emoji: emoji || undefined,
                        });
                      }
                    }}
                  >
                    <input
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      placeholder="Name"
                      className="h-auto w-full min-w-0 rounded-xl border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Choose emoji
                      </Label>
                      <EmojiOptionPicker
                        selected={newChildEmoji}
                        onSelect={setNewChildEmoji}
                      />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Dialog.Close
                        type="button"
                        className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                      >
                        Cancel
                      </Dialog.Close>
                      <button
                        type="submit"
                        disabled={addChildMut.isPending}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={morningRoutinesTipOpen}
        onOpenChange={setMorningRoutinesTipOpen}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-[opacity,backdrop-filter] duration-150 supports-backdrop-filter:backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg outline-none">
              <Dialog.Title className="text-lg font-semibold">
                Morning task added
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Your morning routine item is saved. On the free plan it does not
                show on the kids dashboard.{" "}
                {showBillingLinks
                  ? "Upgrade to include morning checklists on the dashboard."
                  : "Ask the primary account holder to upgrade to show morning checklists on the dashboard."}
              </Dialog.Description>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Dialog.Close
                  type="button"
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Close
                </Dialog.Close>
                {showBillingLinks ? (
                  <Link
                    href="/upgrade"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    View plans & upgrade
                  </Link>
                ) : null}
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {data.children.length === 0 ? (
        <p className="text-muted-foreground">
          Add a child to start their morning and evening checklists.
        </p>
      ) : null}

      <DndContext
        sensors={childSensors}
        collisionDetection={closestCenter}
        onDragEnd={onChildrenDragEnd}
      >
        <SortableContext
          items={visibleChildren.map((section) => section.child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-8">
            {visibleChildren.map((section) => (
              <SortableConfigChildSection
                key={section.child.id}
                section={section}
                profile={data.profile}
                tab={tab}
                addTaskMut={addTaskMut}
                delChildMut={delChildMut}
                updateChildMut={updateChildMut}
                updateChildTimesMut={updateChildTimesMut}
                delTaskMut={delTaskMut}
                updateTaskMut={updateTaskMut}
                reorderMut={reorderMut}
                taskDrafts={taskDrafts}
                setTaskDrafts={setTaskDrafts}
                routineDrafts={routineDrafts}
                setRoutineDrafts={setRoutineDrafts}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

type ConfigChildSectionProps = {
  section: ChildSectionDTO;
  profile: ProfileDTO;
  tab: RoutineTab;
  addTaskMut: {
    isPending: boolean;
    mutate: (v: { childId: string; title: string; routine: Routine }) => void;
  };
  delChildMut: { mutate: (id: string) => void };
  updateChildMut: {
    isPending: boolean;
    mutate: (v: {
      id: string;
      emoji?: string | null;
      hiddenOnDashboard?: boolean;
      completedTaskIcon?: CompletedTaskIconId;
    }) => void;
  };
  updateChildTimesMut: {
    isPending: boolean;
    mutate: (v: {
      id: string;
      morningStart?: string | null;
      eveningStart?: string | null;
    }) => void;
  };
  delTaskMut: { mutate: (id: string) => void };
  updateTaskMut: {
    isPending: boolean;
    mutate: (v: { id: string; title: string }) => void;
  };
  reorderMut: {
    isPending: boolean;
    mutate: (v: {
      childId: string;
      routine: Routine;
      orderedIds: string[];
    }) => void;
  };
  taskDrafts: Record<string, string>;
  setTaskDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  routineDrafts: Record<string, "morning" | "evening">;
  setRoutineDrafts: React.Dispatch<
    React.SetStateAction<Record<string, "morning" | "evening">>
  >;
  childDragHandle?: React.ButtonHTMLAttributes<HTMLButtonElement>;
};

function SortableConfigChildSection({
  ...props
}: ConfigChildSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.section.child.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const childDragHandle: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    type: "button",
    "aria-label": "Drag to reorder child",
    title: "Drag to reorder child",
    ...attributes,
    ...listeners,
    className:
      "touch-none cursor-grab rounded-xl px-1.5 text-muted-foreground active:cursor-grabbing",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "relative z-10 opacity-90")}
    >
      <ConfigChildSection {...props} childDragHandle={childDragHandle} />
    </div>
  );
}

function ConfigChildSection({
  section,
  profile,
  tab,
  addTaskMut,
  delChildMut,
  updateChildMut,
  updateChildTimesMut,
  delTaskMut,
  updateTaskMut,
  reorderMut,
  taskDrafts,
  setTaskDrafts,
  routineDrafts,
  setRoutineDrafts,
  childDragHandle,
}: ConfigChildSectionProps) {
  const routines = useMemo(() => {
    return resolveRoutineFilter(tab, profile, section.child);
  }, [tab, profile, section.child]);

  const tasks = useMemo(() => {
    if (routines === null) return section.tasks;
    return section.tasks.filter((t) => routines.includes(t.routine));
  }, [section.tasks, routines]);

  const morningTasks = useMemo(
    () => tasks.filter((t) => t.routine === "morning"),
    [tasks],
  );
  const eveningTasks = useMemo(
    () => tasks.filter((t) => t.routine === "evening"),
    [tasks],
  );

  const showRoutineSubheadings =
    morningTasks.length > 0 && eveningTasks.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  function onTasksDragEnd(event: DragEndEvent) {
    if (reorderMut.isPending) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);
    if (!activeTask || !overTask || activeTask.routine !== overTask.routine) {
      return;
    }
    const list =
      activeTask.routine === "morning" ? morningTasks : eveningTasks;
    const oldIndex = list.findIndex((t) => t.id === activeId);
    const newIndex = list.findIndex((t) => t.id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const orderedIds = arrayMove(list, oldIndex, newIndex).map((t) => t.id);
    reorderMut.mutate({
      childId: section.child.id,
      routine: activeTask.routine,
      orderedIds,
    });
  }

  const draftKey = section.child.id;
  const title = taskDrafts[draftKey] ?? "";
  const routine = routineDrafts[draftKey] ?? "morning";
  const [emojiDraft, setEmojiDraft] = useState(() => section.child.emoji ?? "");
  const [emojiModalOpen, setEmojiModalOpen] = useState(false);
  const isEmojiSaving =
    updateChildMut.isPending && (section.child.emoji ?? "") !== emojiDraft;

  const routineTimeOptions = useMemo(
    () =>
      mergeHmOptions([
        section.child.morningStart ?? undefined,
        section.child.eveningStart ?? undefined,
      ]),
    [section.child.morningStart, section.child.eveningStart],
  );

  const profileTz = profile.timezone?.trim() || "UTC";
  const routineStartTimeLabels = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of routineTimeOptions) {
      m.set(t, formatTimeHmForLocaleInProfileZone(t, profileTz));
    }
    return m;
  }, [routineTimeOptions, profileTz]);

  const routineTimeSelectItems = useMemo(
    () =>
      routineTimeOptions.map((t) => ({
        value: t,
        label: routineStartTimeLabels.get(t) ?? t,
      })),
    [routineTimeOptions, routineStartTimeLabels],
  );

  const completedTaskIconSelectItems = useMemo(
    () =>
      COMPLETED_TASK_ICON_OPTIONS.map((opt) => ({
        value: opt.id,
        label: (
          <span className="flex min-w-0 items-center gap-2">
            <CompletedTaskIconGraphic
              iconId={opt.id}
              className="shrink-0 text-base leading-none"
            />
            {opt.label}
          </span>
        ),
      })),
    [],
  );

  function handleEmojiSelect(nextEmoji: string) {
    const normalized = nextEmoji.trim();
    setEmojiDraft(normalized);
    if ((section.child.emoji ?? "") === normalized) {
      return;
    }

    updateChildMut.mutate({
      id: section.child.id,
      emoji: normalized || null,
    });
  }

  function handleEmojiSelectInModal(nextEmoji: string) {
    handleEmojiSelect(nextEmoji);
    setEmojiModalOpen(false);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {childDragHandle ? (
            <button {...childDragHandle}>
              <GripVertical className="size-5 shrink-0" aria-hidden />
            </button>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="flex flex-wrap items-center gap-x-1.5 text-xl font-semibold text-foreground">
              <button
                type="button"
                onClick={() => {
                  if (!updateChildMut.isPending) {
                    setEmojiDraft(section.child.emoji ?? "");
                  }
                  setEmojiModalOpen(true);
                }}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent text-3xl leading-none transition-colors",
                  "hover:border-border hover:bg-muted/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  !section.child.emoji &&
                    "size-10 border-dashed border-border text-muted-foreground",
                )}
                aria-label={`Choose emoji for ${section.child.name}`}
              >
                {section.child.emoji ? (
                  <span className="px-0.5" aria-hidden>
                    {section.child.emoji}
                  </span>
                ) : (
                  <Smile className="size-7" strokeWidth={1.5} aria-hidden />
                )}
              </button>
              {section.child.name}
            </h2>
            {isEmojiSaving ? (
              <span className="text-xs text-muted-foreground" aria-live="polite">
                Saving emoji…
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              updateChildMut.mutate({
                id: section.child.id,
                emoji: section.child.emoji ?? null,
                hiddenOnDashboard: !section.child.hiddenOnDashboard,
              });
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              section.child.hiddenOnDashboard
                ? "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                : "border-brand-lime/40 bg-brand-lime/15 text-brand-grape hover:bg-brand-lime/25",
            )}
            title={
              section.child.hiddenOnDashboard
                ? "Hidden from dashboard — click to show"
                : "Visible on dashboard — click to hide"
            }
          >
            {section.child.hiddenOnDashboard ? (
              <EyeOff className="size-3.5" aria-hidden />
            ) : (
              <Eye className="size-3.5" aria-hidden />
            )}
            {section.child.hiddenOnDashboard ? "Hidden" : "Visible"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `Remove ${section.child.name} and all of their tasks?`,
                )
              )
                delChildMut.mutate(section.child.id);
            }}
            className="text-sm text-destructive hover:underline"
          >
            Remove child
          </button>
        </div>
      </div>

      <Dialog.Root open={emojiModalOpen} onOpenChange={setEmojiModalOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-[opacity,backdrop-filter] duration-150 supports-backdrop-filter:backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="max-h-[min(90vh,560px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg outline-none">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Emoji for {section.child.name}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Pick an emoji to show next to this child&apos;s name, or choose
                none to hide it.
              </Dialog.Description>
              <div className="mt-4">
                <EmojiOptionPicker
                  key={`${section.child.id}-${emojiModalOpen}`}
                  selected={emojiDraft}
                  onSelect={handleEmojiSelectInModal}
                />
              </div>
              <div className="mt-6 flex justify-end">
                <Dialog.Close
                  type="button"
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            Morning start
          </Label>
          <Select
            value={
              section.child.morningStart ?? DEFAULT_CHILD_MORNING_START
            }
            items={routineTimeSelectItems}
            disabled={updateChildTimesMut.isPending}
            onValueChange={(v) => {
              const next = v ?? DEFAULT_CHILD_MORNING_START;
              updateChildTimesMut.mutate({
                id: section.child.id,
                morningStart:
                  next === DEFAULT_CHILD_MORNING_START ? null : next,
              });
            }}
          >
            <SelectTrigger className="h-auto w-full min-w-0 rounded-xl py-2">
              <SelectValue />
            </SelectTrigger>
            {/* alignItemWithTrigger breaks positioning inside sortable CSS transforms (dnd-kit). */}
            <SelectContent
              className="max-h-72"
              alignItemWithTrigger={false}
            >
              {routineTimeOptions.map((t) => (
                <SelectItem
                  key={`m-${t}`}
                  value={t}
                  label={routineStartTimeLabels.get(t) ?? t}
                >
                  {routineStartTimeLabels.get(t) ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            Evening start
          </Label>
          <Select
            value={
              section.child.eveningStart ?? DEFAULT_CHILD_EVENING_START
            }
            items={routineTimeSelectItems}
            disabled={updateChildTimesMut.isPending}
            onValueChange={(v) => {
              const next = v ?? DEFAULT_CHILD_EVENING_START;
              updateChildTimesMut.mutate({
                id: section.child.id,
                eveningStart:
                  next === DEFAULT_CHILD_EVENING_START ? null : next,
              });
            }}
          >
            <SelectTrigger className="h-auto w-full min-w-0 rounded-xl py-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="max-h-72"
              alignItemWithTrigger={false}
            >
              {routineTimeOptions.map((t) => (
                <SelectItem
                  key={`e-${t}`}
                  value={t}
                  label={routineStartTimeLabels.get(t) ?? t}
                >
                  {routineStartTimeLabels.get(t) ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        15-minute steps; labels follow your device&apos;s clock style (12-hour or
        24-hour). Morning is from morning start until evening start; evening runs
        from evening start until morning start the next calendar day (in{" "}
        <span className="font-medium text-foreground">
          {profile.timezone?.trim() || "your timezone"}
        </span>
        ).
      </p>

      <div className="mt-4 flex flex-col gap-1">
        <Label
          htmlFor={`completed-task-icon-${section.child.id}`}
          className="text-xs text-muted-foreground"
        >
          Done icon on dashboard
        </Label>
        <Select
          value={section.child.completedTaskIcon}
          items={completedTaskIconSelectItems}
          onValueChange={(v) => {
            if (v == null) return;
            const next = normalizeCompletedTaskIcon(v);
            if (next !== section.child.completedTaskIcon) {
              updateChildMut.mutate({
                id: section.child.id,
                completedTaskIcon: next,
              });
            }
          }}
          disabled={updateChildMut.isPending}
        >
          <SelectTrigger
            id={`completed-task-icon-${section.child.id}`}
            className="h-auto w-full min-w-0 rounded-xl py-2"
          >
            <SelectValue placeholder="Choose an icon" />
          </SelectTrigger>
          <SelectContent className="max-h-72" alignItemWithTrigger={false}>
            {COMPLETED_TASK_ICON_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.id}
                value={opt.id}
                label={opt.label}
                title={opt.description}
              >
                <CompletedTaskIconGraphic
                  iconId={opt.id}
                  className="text-base"
                />
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Shown on {section.child.name}&apos;s tasks when they&apos;re marked
          done. Colors and fonts are on{" "}
          <Link
            href="/settings"
            className="font-medium text-brand-grape underline underline-offset-2 hover:text-brand-grape/85"
          >
            Settings
          </Link>
          .
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks in this view — try &quot;All&quot; or add a task below.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onTasksDragEnd}
          >
            <div className="flex flex-col gap-4">
              {morningTasks.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {showRoutineSubheadings ? (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Morning
                    </h3>
                  ) : null}
                  <SortableContext
                    items={morningTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {morningTasks.map((task) => (
                        <SortableRoutineTaskRow
                          key={task.id}
                          task={task}
                          delTaskMut={delTaskMut}
                          updateTaskMut={updateTaskMut}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              ) : null}
              {eveningTasks.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {showRoutineSubheadings ? (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Evening
                    </h3>
                  ) : null}
                  <SortableContext
                    items={eveningTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {eveningTasks.map((task) => (
                        <SortableRoutineTaskRow
                          key={task.id}
                          task={task}
                          delTaskMut={delTaskMut}
                          updateTaskMut={updateTaskMut}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              ) : null}
            </div>
          </DndContext>
        )}
      </div>

      <form
        className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          const t = title.trim();
          if (!t) return;
          addTaskMut.mutate({
            childId: section.child.id,
            title: t,
            routine,
          });
          setTaskDrafts((d) => ({ ...d, [draftKey]: "" }));
        }}
      >
        <div className="flex min-w-[160px] flex-1 flex-col gap-2">
          <Label className="text-muted-foreground">New task</Label>
          <input
            value={title}
            onChange={(e) =>
              setTaskDrafts((d) => ({ ...d, [draftKey]: e.target.value }))
            }
            placeholder="e.g. Brush teeth"
            className="h-auto w-full min-w-0 rounded-xl border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex min-w-[160px] flex-col gap-2">
          <Label className="text-muted-foreground">When</Label>
          <Select
            value={routine}
            items={ROUTINE_WHEN_SELECT_ITEMS}
            onValueChange={(value) =>
              setRoutineDrafts((d) => ({
                ...d,
                [draftKey]: (value ?? "morning") as "morning" | "evening",
              }))
            }
          >
            <SelectTrigger className="h-auto w-full min-w-0 rounded-xl py-2">
              <SelectValue placeholder="Choose when" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning" label="Morning">
                Morning
              </SelectItem>
              <SelectItem value="evening" label="Evening">
                Evening
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button
          type="submit"
          disabled={addTaskMut.isPending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Add task
        </button>
      </form>
    </section>
  );
}

function EmojiOptionPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const selectedInMore = MORE_CHILD_EMOJI_OPTIONS.includes(
    selected as (typeof MORE_CHILD_EMOJI_OPTIONS)[number],
  );
  const showMoreOptions = showMore;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
          selected
            ? "border-border bg-background text-muted-foreground hover:bg-muted"
            : "border-brand-lime bg-brand-lime/15 text-brand-grape",
        )}
        aria-label="No emoji"
      >
        None
      </button>
      {CHILD_EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={cn(
            "h-9 w-9 rounded-full border text-xl transition-colors",
            selected === emoji
              ? "border-brand-lime bg-brand-lime/15"
              : "border-border bg-background hover:bg-muted",
          )}
          aria-label={`Use ${emoji} emoji`}
        >
          {emoji}
        </button>
      ))}
      {showMoreOptions
        ? MORE_CHILD_EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className={cn(
                "h-9 w-9 rounded-full border text-xl transition-colors",
                selected === emoji
                  ? "border-brand-lime bg-brand-lime/15"
                  : "border-border bg-background hover:bg-muted",
              )}
              aria-label={`Use ${emoji} emoji`}
            >
              {emoji}
            </button>
          ))
        : null}
      {!showMoreOptions && selectedInMore ? (
        <button
          type="button"
          onClick={() => onSelect(selected)}
          className="h-9 w-9 rounded-full border border-brand-lime bg-brand-lime/15 text-xl transition-colors"
          aria-label={`Use ${selected} emoji`}
        >
          {selected}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setShowMore((value) => !value)}
        className="rounded-full border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        aria-label={showMoreOptions ? "Show fewer emoji options" : "Show more emoji options"}
      >
        {showMoreOptions ? "Less" : "More"}
      </button>
    </div>
  );
}

function SortableRoutineTaskRow({
  task,
  delTaskMut,
  updateTaskMut,
}: {
  task: TaskDTO;
  delTaskMut: { mutate: (id: string) => void };
  updateTaskMut: {
    isPending: boolean;
    mutate: (v: { id: string; title: string }) => void;
  };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function saveTitle() {
    const nextTitle = titleDraft.trim();
    if (!nextTitle || nextTitle === task.title) {
      setTitleDraft(task.title);
      setIsEditing(false);
      return;
    }
    updateTaskMut.mutate({ id: task.id, title: nextTitle });
    setIsEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-2",
        isDragging && "relative z-10 opacity-90",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        title="Drag to reorder"
        className="touch-none cursor-grab rounded-xl px-1.5 text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5 shrink-0" aria-hidden />
      </button>
      <div
        className="min-h-[52px] flex-1 rounded-2xl border-2 border-input bg-background px-4 py-3 text-left text-base font-medium text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs font-normal uppercase text-muted-foreground">
            {task.routine}
          </span>
          {isEditing ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveTitle();
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setTitleDraft(task.title);
                  setIsEditing(false);
                }
              }}
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-base font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleDraft(task.title);
                setIsEditing(true);
              }}
              className="min-w-0 flex-1 rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {task.title}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        title="Delete task"
        onClick={() => {
          if (confirm("Delete this task?")) delTaskMut.mutate(task.id);
        }}
        className="rounded-xl border border-border px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        ×
      </button>
    </div>
  );
}
