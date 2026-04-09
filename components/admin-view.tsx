"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOverviewAction,
  adminCreateChildAction,
  adminCreateTaskAction,
  adminDeleteChildAction,
  adminDeleteTaskAction,
} from "@/app/actions/admin";
import { toggleTaskCompletionAction } from "@/app/actions/completions";
import { queryKeys } from "@/lib/query-keys";
import type { AdminUserRowDTO, Routine } from "@/lib/types";
import { useState } from "react";

export function AdminView() {
  const queryClient = useQueryClient();
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [newChildByUser, setNewChildByUser] = useState<Record<string, string>>(
    {},
  );
  const [taskTitle, setTaskTitle] = useState<Record<string, string>>({});
  const [taskRoutine, setTaskRoutine] = useState<
    Record<string, "morning" | "evening">
  >({});

  const adminQuery = useQuery({
    queryKey: queryKeys.admin,
    queryFn: async () => {
      const r = await getAdminOverviewAction();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.admin });

  const toggleMut = useMutation({
    mutationFn: async (vars: { childId: string; taskId: string }) => {
      const r = await toggleTaskCompletionAction(vars.childId, vars.taskId);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const addChildMut = useMutation({
    mutationFn: async (vars: { userId: string; name: string }) => {
      const r = await adminCreateChildAction(vars.userId, { name: vars.name });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  const addTaskMut = useMutation({
    mutationFn: async (vars: {
      ownerId: string;
      childId: string;
      title: string;
      routine: Routine;
    }) => {
      const r = await adminCreateTaskAction(vars.ownerId, {
        childId: vars.childId,
        title: vars.title,
        routine: vars.routine,
      });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  const delChildMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await adminDeleteChildAction(id);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  const delTaskMut = useMutation({
    mutationFn: async (vars: { ownerId: string; taskId: string }) => {
      const r = await adminDeleteTaskAction(vars.ownerId, vars.taskId);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => invalidate(),
  });

  if (adminQuery.isLoading) {
    return <p className="p-6">Loading admin data…</p>;
  }

  if (adminQuery.isError || !adminQuery.data) {
    return (
      <p className="p-6 text-red-600">
        {adminQuery.error instanceof Error
          ? adminQuery.error.message
          : "Error"}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Admin — all families</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Clerk user ids and Mongo-backed children/tasks. Toggle completions as
        the parent would (per that user&apos;s timezone).
      </p>

      <ul className="mt-8 flex flex-col gap-4">
        {adminQuery.data.users.map((row) => (
          <li
            key={row.clerkId}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              onClick={() =>
                setOpenUser((u) => (u === row.clerkId ? null : row.clerkId))
              }
            >
              <span className="font-mono text-sm">{row.clerkId}</span>
              <span className="text-zinc-500">
                {row.children.length} children ·{" "}
                {openUser === row.clerkId ? "▼" : "▶"}
              </span>
            </button>
            {openUser === row.clerkId ? (
              <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">
                  Timezone: {row.profile?.timezone ?? "—"} · Today (
                  completions): uses profile tz when present
                </p>
                <form
                  className="mt-3 flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = (newChildByUser[row.clerkId] ?? "").trim();
                    if (name)
                      addChildMut.mutate({ userId: row.clerkId, name });
                  }}
                >
                  <input
                    value={newChildByUser[row.clerkId] ?? ""}
                    onChange={(e) =>
                      setNewChildByUser((m) => ({
                        ...m,
                        [row.clerkId]: e.target.value,
                      }))
                    }
                    placeholder="New child name"
                    className="min-w-[180px] flex-1 rounded-lg border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Add child
                  </button>
                </form>
                <ul className="mt-4 flex flex-col gap-6">
                  {row.children.map((sec) => (
                    <AdminChildBlock
                      key={sec.child.id}
                      row={row}
                      section={sec}
                      toggleMut={toggleMut}
                      addTaskMut={addTaskMut}
                      delChildMut={delChildMut}
                      delTaskMut={delTaskMut}
                      taskTitle={taskTitle}
                      setTaskTitle={setTaskTitle}
                      taskRoutine={taskRoutine}
                      setTaskRoutine={setTaskRoutine}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminChildBlock({
  row,
  section,
  toggleMut,
  addTaskMut,
  delChildMut,
  delTaskMut,
  taskTitle,
  setTaskTitle,
  taskRoutine,
  setTaskRoutine,
}: {
  row: AdminUserRowDTO;
  section: AdminUserRowDTO["children"][number];
  toggleMut: {
    isPending: boolean;
    mutate: (v: { childId: string; taskId: string }) => void;
  };
  addTaskMut: {
    mutate: (v: {
      ownerId: string;
      childId: string;
      title: string;
      routine: Routine;
    }) => void;
  };
  delChildMut: { mutate: (id: string) => void };
  delTaskMut: {
    mutate: (v: { ownerId: string; taskId: string }) => void;
  };
  taskTitle: Record<string, string>;
  setTaskTitle: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  taskRoutine: Record<string, "morning" | "evening">;
  setTaskRoutine: React.Dispatch<
    React.SetStateAction<Record<string, "morning" | "evening">>
  >;
}) {
  const key = section.child.id;
  const title = taskTitle[key] ?? "";
  const routine = taskRoutine[key] ?? "morning";
  const done = new Set(section.completedTaskIds);

  return (
    <li className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{section.child.name}</h3>
        <button
          type="button"
          className="text-sm text-red-600"
          onClick={() => {
            if (confirm("Delete this child for this user?"))
              delChildMut.mutate(section.child.id);
          }}
        >
          Delete child
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {section.tasks.map((task) => (
          <div key={task.id} className="flex gap-2">
            <button
              type="button"
              disabled={toggleMut.isPending}
              onClick={() =>
                toggleMut.mutate({
                  childId: section.child.id,
                  taskId: task.id,
                })
              }
              className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm ${
                done.has(task.id)
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <span className="text-xs uppercase text-zinc-500">
                {task.routine}
              </span>{" "}
              {task.title}
            </button>
            <button
              type="button"
              className="px-2 text-zinc-500"
              onClick={() =>
                delTaskMut.mutate({
                  ownerId: row.clerkId,
                  taskId: task.id,
                })
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = title.trim();
          if (!t) return;
          addTaskMut.mutate({
            ownerId: row.clerkId,
            childId: section.child.id,
            title: t,
            routine,
          });
          setTaskTitle((m) => ({ ...m, [key]: "" }));
        }}
      >
        <input
          value={title}
          onChange={(e) =>
            setTaskTitle((m) => ({ ...m, [key]: e.target.value }))
          }
          placeholder="Task title"
          className="min-w-[140px] flex-1 rounded-lg border px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <select
          value={routine}
          onChange={(e) =>
            setTaskRoutine((m) => ({
              ...m,
              [key]: e.target.value as "morning" | "evening",
            }))
          }
          className="rounded-lg border-2 border-input bg-card px-2 py-1.5 text-sm text-foreground shadow-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="morning">Morning</option>
          <option value="evening">Evening</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-800 px-3 py-1 text-sm text-white dark:bg-zinc-200 dark:text-zinc-900"
        >
          Add task
        </button>
      </form>
    </li>
  );
}
