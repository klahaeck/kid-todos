"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getDashboardData } from "@/app/actions/dashboard";
import { toggleTaskCompletionAction } from "@/app/actions/completions";
import { queryKeys } from "@/lib/query-keys";
import type { ChildSectionDTO, ProfileDTO, Routine } from "@/lib/types";
import {
  kidRoutineHeading,
  routineWindowsSummary,
  routinesVisibleForKidNow,
} from "@/lib/routine-filter";
import { useConfetti } from "@/components/confetti-provider";

export function DashboardView() {
  const queryClient = useQueryClient();
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

  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return (
      <p className="p-8 text-center text-xl text-muted-foreground">
        Loading…
      </p>
    );
  }

  if (dashboardQuery.isError || !data) {
    return (
      <p className="p-8 text-center text-xl text-red-600">
        {dashboardQuery.error instanceof Error
          ? dashboardQuery.error.message
          : "Something went wrong"}
      </p>
    );
  }

  const hasChildren = data.children.length > 0;
  const hasAnyTask = data.children.some((s) => s.tasks.length > 0);
  const pageHeading = kidRoutineHeading(data.profile, undefined);
  const pageWindowsLine = routineWindowsSummary(data.profile, undefined);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col gap-8 px-4 py-8 pb-16">
      {/* <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Tap when you&apos;re done
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          {hasChildren
            ? "Only tasks for the current morning or evening window (set under Routine settings)."
            : "Ask a grown-up to add your routines first."}
        </p>
        {hasChildren && hasAnyTask ? (
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Times use{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {data.profile.timezone?.trim() || "UTC"}
            </span>
            . Change windows in{" "}
            <Link
              href="/settings"
              className="font-medium text-emerald-700 underline dark:text-emerald-400"
            >
              Routine settings
            </Link>
            .
          </p>
        ) : null}
      </header> */}

      {!hasChildren || !hasAnyTask ? (
        <p className="rounded-3xl bg-secondary px-6 py-5 text-center text-lg text-secondary-foreground">
          {!hasChildren
            ? "No kids listed yet."
            : "No tasks yet for these routines."}{" "}
          <Link
            href="/routines"
            className="font-semibold text-primary underline"
          >
            Set up routines
          </Link>
        </p>
      ) : null}

      {hasChildren && hasAnyTask ? (
        <header className="text-center">
          <h2 className="text-xl font-bold text-foreground">{pageHeading}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{pageWindowsLine}</p>
        </header>
      ) : null}

      {data.children.map((section) => (
        <KidRoutineBlock
          key={section.child.id}
          section={section}
          profile={data.profile}
          toggleMut={toggleMut}
        />
      ))}

      {/* <p className="text-center text-sm text-muted-foreground">
        <Link href="/routines" className="underline hover:text-foreground">
          Edit routines (grown-ups)
        </Link>
        {" · "}
        <Link href="/settings" className="underline hover:text-foreground">
          Times &amp; timezone
        </Link>
      </p> */}
    </div>
  );
}

function KidRoutineBlock({
  section,
  profile,
  toggleMut,
}: {
  section: ChildSectionDTO;
  profile: ProfileDTO;
  toggleMut: {
    isPending: boolean;
    mutate: (v: { childId: string; taskId: string }) => void;
  };
}) {
  const allowedRoutines = useMemo(
    () => routinesVisibleForKidNow(profile, section.child),
    [profile, section.child],
  );

  const tasks = useMemo(
    () => section.tasks.filter((t) => allowedRoutines.includes(t.routine)),
    [section.tasks, allowedRoutines],
  );

  const windowsLine = routineWindowsSummary(profile, section.child);
  const done = new Set(section.completedTaskIds);

  if (section.tasks.length === 0) return null;

  return (
    <section className="flex w-full flex-col gap-4 rounded-3xl border-2 border-border bg-card/90 p-5 text-card-foreground shadow-sm">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-foreground">{section.child.name}</h2>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-2xl bg-muted px-4 py-4 text-center text-sm text-muted-foreground">
          {allowedRoutines.length === 0 ? (
            <>
              It isn&apos;t morning or evening routine time for this child. Windows:{" "}
              <span className="font-medium text-foreground">{windowsLine}</span>
              . Adjust them in{" "}
              <Link
                href="/settings"
                className="font-semibold text-primary underline"
              >
                Routine settings
              </Link>
              .
            </>
          ) : (
            <>No tasks in this window yet.</>
          )}
        </p>
      ) : (
        <ul className="flex flex-row flex-wrap gap-3 sm:gap-4">
          {tasks.map((task) => (
            <li key={task.id} className="min-w-0 flex-1 basis-38 sm:basis-44">
              <TaskTapButton
                task={task}
                complete={done.has(task.id)}
                disabled={toggleMut.isPending}
                onTap={() =>
                  toggleMut.mutate({
                    childId: section.child.id,
                    taskId: task.id,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskTapButton({
  task,
  complete,
  disabled,
  onTap,
}: {
  task: { id: string; title: string; routine: Routine };
  complete: boolean;
  disabled: boolean;
  onTap: () => void;
}) {
  const { addConfetti } = useConfetti();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onTap();
        if (!complete) {
          addConfetti();
        }
      }}
      className={`flex h-full min-h-17 w-full items-center justify-center rounded-3xl border-4 px-4 py-4 text-center text-lg font-bold leading-snug shadow-sm transition-all active:scale-[0.98] sm:min-h-19 sm:px-5 sm:text-xl ${
        complete
          ? "border-(--kid-done-border) bg-(--kid-done-bg) text-(--kid-done-fg)"
          : "border-(--kid-todo-border) bg-(--kid-todo-bg) text-(--kid-todo-fg) hover:brightness-[0.97]"
      } disabled:opacity-60`}
    >
      <span className="line-clamp-3 wrap-break-word">
        {task.title}
        {complete ? (
          <span className="ml-1 inline-block align-middle text-xl sm:text-2xl" aria-hidden>
            ✓
          </span>
        ) : null}
      </span>
    </button>
  );
}
