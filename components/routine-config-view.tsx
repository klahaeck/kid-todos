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
import { GripVertical } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getDashboardData } from "@/app/actions/dashboard";
import { createChildAction, deleteChildAction } from "@/app/actions/children";
import {
  createTaskAction,
  deleteTaskAction,
  reorderTasksAction,
} from "@/app/actions/tasks";
import { toggleTaskCompletionAction } from "@/app/actions/completions";
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
  ProfileDTO,
  Routine,
  TaskDTO,
} from "@/lib/types";
import {
  resolveRoutineFilter,
  type RoutineTab,
} from "@/lib/routine-filter";

export function RoutineConfigView() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RoutineTab>("all");
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [newChildName, setNewChildName] = useState("");
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

  const toggleMut = useMutation({
    mutationFn: async (vars: { childId: string; taskId: string }) => {
      const r = await toggleTaskCompletionAction(vars.childId, vars.taskId);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  const addChildMut = useMutation({
    mutationFn: async (name: string) => {
      const r = await createChildAction({ name });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      setNewChildName("");
      setAddChildOpen(false);
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
    onSuccess: () => invalidate(),
  });

  const delChildMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await deleteChildAction(id);
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

  const reorderMut = useMutation({
    mutationFn: async (vars: { childId: string; orderedIds: string[] }) => {
      const r = await reorderTasksAction(vars);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  const data = dashboardQuery.data;

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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Routine setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add children and tasks here. Kids use the{" "}
          <Link
            href="/dashboard"
            className="font-medium text-primary underline"
          >
            dashboard
          </Link>{" "}
          to tap tasks when they finish them.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Preview uses calendar day{" "}
          <span className="font-medium text-foreground">{data.today}</span>{" "}
          ({data.profile.timezone?.trim() || "UTC"}).
        </p>
      </div>

      <Dialog.Root
        open={addChildOpen}
        onOpenChange={(open) => {
          setAddChildOpen(open);
          if (!open) setNewChildName("");
        }}
      >
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
            onClick={() => setAddChildOpen(true)}
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Add child
          </button>
        </div>

        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-[opacity,backdrop-filter] duration-150 supports-backdrop-filter:backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg outline-none">
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
                  if (n) addChildMut.mutate(n);
                }}
              >
                <input
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Name"
                  className="h-auto w-full min-w-0 rounded-xl border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
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
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {data.children.length === 0 ? (
        <p className="text-muted-foreground">
          Add a child to start their morning and evening checklists.
        </p>
      ) : null}

      {data.children.map((section) => (
        <ConfigChildSection
          key={section.child.id}
          section={section}
          profile={data.profile}
          tab={tab}
          toggleMut={toggleMut}
          addTaskMut={addTaskMut}
          delChildMut={delChildMut}
          delTaskMut={delTaskMut}
          reorderMut={reorderMut}
          taskDrafts={taskDrafts}
          setTaskDrafts={setTaskDrafts}
          routineDrafts={routineDrafts}
          setRoutineDrafts={setRoutineDrafts}
        />
      ))}
    </div>
  );
}

function ConfigChildSection({
  section,
  profile,
  tab,
  toggleMut,
  addTaskMut,
  delChildMut,
  delTaskMut,
  reorderMut,
  taskDrafts,
  setTaskDrafts,
  routineDrafts,
  setRoutineDrafts,
}: {
  section: ChildSectionDTO;
  profile: ProfileDTO;
  tab: RoutineTab;
  toggleMut: {
    isPending: boolean;
    mutate: (v: { childId: string; taskId: string }) => void;
  };
  addTaskMut: {
    isPending: boolean;
    mutate: (v: { childId: string; title: string; routine: Routine }) => void;
  };
  delChildMut: { mutate: (id: string) => void };
  delTaskMut: { mutate: (id: string) => void };
  reorderMut: {
    isPending: boolean;
    mutate: (v: { childId: string; orderedIds: string[] }) => void;
  };
  taskDrafts: Record<string, string>;
  setTaskDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  routineDrafts: Record<string, "morning" | "evening">;
  setRoutineDrafts: React.Dispatch<
    React.SetStateAction<Record<string, "morning" | "evening">>
  >;
}) {
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
      orderedIds,
    });
  }

  const draftKey = section.child.id;
  const title = taskDrafts[draftKey] ?? "";
  const routine = routineDrafts[draftKey] ?? "morning";
  const done = new Set(section.completedTaskIds);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-semibold text-foreground">{section.child.name}</h2>
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
                          complete={done.has(task.id)}
                          childId={section.child.id}
                          toggleMut={toggleMut}
                          delTaskMut={delTaskMut}
                          reorderDisabled={reorderMut.isPending}
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
                          complete={done.has(task.id)}
                          childId={section.child.id}
                          toggleMut={toggleMut}
                          delTaskMut={delTaskMut}
                          reorderDisabled={reorderMut.isPending}
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
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
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

function SortableRoutineTaskRow({
  task,
  complete,
  childId,
  toggleMut,
  delTaskMut,
  reorderDisabled,
}: {
  task: TaskDTO;
  complete: boolean;
  childId: string;
  toggleMut: {
    isPending: boolean;
    mutate: (v: { childId: string; taskId: string }) => void;
  };
  delTaskMut: { mutate: (id: string) => void };
  reorderDisabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: reorderDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
        disabled={reorderDisabled}
        className="touch-none cursor-grab rounded-xl border border-border px-1.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5 shrink-0" aria-hidden />
      </button>
      <button
        type="button"
        disabled={toggleMut.isPending}
        onClick={() =>
          toggleMut.mutate({
            childId,
            taskId: task.id,
          })
        }
        className={`min-h-[52px] flex-1 rounded-2xl border-2 px-4 py-3 text-left text-base font-medium transition-colors ${
          complete
            ? "border-primary bg-primary/15 text-foreground"
            : "border-input bg-background text-foreground"
        }`}
      >
        <span className="mr-2 text-xs font-normal uppercase text-muted-foreground">
          {task.routine}
        </span>
        {task.title}
        {complete ? (
          <span className="ml-2 text-primary">
            ✓
          </span>
        ) : null}
      </button>
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
