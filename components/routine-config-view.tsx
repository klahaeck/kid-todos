"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getDashboardData } from "@/app/actions/dashboard";
import { createChildAction, deleteChildAction } from "@/app/actions/children";
import { createTaskAction, deleteTaskAction } from "@/app/actions/tasks";
import { toggleTaskCompletionAction } from "@/app/actions/completions";
import { queryKeys } from "@/lib/query-keys";
import type { ChildSectionDTO, ProfileDTO, Routine } from "@/lib/types";
import {
  resolveRoutineFilter,
  type RoutineTab,
} from "@/lib/routine-filter";

export function RoutineConfigView() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RoutineTab>("all");
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

  const data = dashboardQuery.data;

  const tabButtons: { id: RoutineTab; label: string }[] = [
    { id: "auto", label: "Now" },
    { id: "morning", label: "Morning" },
    { id: "evening", label: "Evening" },
    { id: "all", label: "All" },
  ];

  if (dashboardQuery.isLoading) {
    return (
      <p className="p-6 text-zinc-600 dark:text-zinc-400">Loading routines…</p>
    );
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Routine setup
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add children and tasks here. Kids use the{" "}
          <Link
            href="/dashboard"
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            dashboard
          </Link>{" "}
          to tap tasks when they finish them.
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Preview uses calendar day{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {data.today}
          </span>{" "}
          ({data.profile.timezone}).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabButtons.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setTab(b.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === b.id
                ? "bg-emerald-600 text-white"
                : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Add a child
        </h2>
        <form
          className="mt-3 flex flex-wrap gap-2"
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
            className="min-w-[200px] flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-600 dark:bg-zinc-950"
          />
          <button
            type="submit"
            disabled={addChildMut.isPending}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add
          </button>
        </form>
      </section>

      {data.children.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
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

  const draftKey = section.child.id;
  const title = taskDrafts[draftKey] ?? "";
  const routine = routineDrafts[draftKey] ?? "morning";
  const done = new Set(section.completedTaskIds);

  return (
    <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {section.child.name}
        </h2>
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
          className="text-sm text-red-600 hover:underline"
        >
          Remove child
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No tasks in this view — try &quot;All&quot; or add a task below.
          </p>
        ) : null}
        {tasks.map((task) => {
          const complete = done.has(task.id);
          return (
            <div key={task.id} className="flex items-stretch gap-2">
              <button
                type="button"
                disabled={toggleMut.isPending}
                onClick={() =>
                  toggleMut.mutate({
                    childId: section.child.id,
                    taskId: task.id,
                  })
                }
                className={`min-h-[52px] flex-1 rounded-2xl border-2 px-4 py-3 text-left text-base font-medium transition-colors ${
                  complete
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                    : "border-zinc-300 bg-white text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                }`}
              >
                <span className="mr-2 text-xs font-normal uppercase text-zinc-500">
                  {task.routine}
                </span>
                {task.title}
                {complete ? (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                title="Delete task"
                onClick={() => {
                  if (confirm("Delete this task?"))
                    delTaskMut.mutate(task.id);
                }}
                className="rounded-xl border border-zinc-200 px-3 text-sm text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <form
        className="mt-4 flex flex-wrap items-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800"
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
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">New task</label>
          <input
            value={title}
            onChange={(e) =>
              setTaskDrafts((d) => ({ ...d, [draftKey]: e.target.value }))
            }
            placeholder="e.g. Brush teeth"
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">When</label>
          <select
            value={routine}
            onChange={(e) =>
              setRoutineDrafts((d) => ({
                ...d,
                [draftKey]: e.target.value as "morning" | "evening",
              }))
            }
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={addTaskMut.isPending}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add task
        </button>
      </form>
    </section>
  );
}
