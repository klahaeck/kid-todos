"use client";

import { animate } from "animejs";
import Link from "next/link";
import { Check, Maximize2, Minimize2, Moon, Sparkles, Sun } from "lucide-react";
import {
  useMutation,
  useMutationState,
  useQuery as useRqQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMutation as useConvexMutation, useQuery as useConvexQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { getDashboardData } from "@/app/actions/dashboard";
import { optimisticToggleCompletion } from "@/lib/optimistic-completions";
import type { Id } from "@/convex/_generated/dataModel";
import { calendarDateInTimezone } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import type {
  ChildSectionDTO,
  DashboardDTO,
  ProfileDTO,
  Routine,
  TaskDTO,
} from "@/lib/types";
import {
  routineListAllRoutinesGate,
  routineWindowsSummary,
  routinesVisibleForKidNow,
} from "@/lib/routine-filter";
import { useConfetti } from "@/components/confetti-provider";
import { CompletedTaskIconGraphic } from "@/components/completed-task-icon-graphic";
import { Button } from "@/components/ui/button";
import type { CompletedTaskIconId } from "@/lib/completed-task-icon-options";
import { cn } from "@/lib/utils";

function CelebrationHeadline({
  text,
  className,
  style,
  exiting,
  onExitComplete,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
  exiting: boolean;
  onExitComplete: () => void;
}) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const onExitCompleteRef = useRef(onExitComplete);

  useEffect(() => {
    onExitCompleteRef.current = onExitComplete;
  }, [onExitComplete]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const animation = animate(root, {
      opacity: [0, 1],
      translateY: ["0.2em", "0em"],
      duration: 480,
      ease: "outCubic",
    });

    return () => {
      animation.revert();
    };
  }, [text]);

  useEffect(() => {
    if (!exiting) return;
    const root = containerRef.current;
    if (!root) return;
    let cancelled = false;
    const animation = animate(root, {
      opacity: [1, 0],
      translateY: ["0em", "-0.2em"],
      duration: 380,
      ease: "inCubic",
    });

    void animation.then(() => {
      if (!cancelled) {
        onExitCompleteRef.current();
      }
    });

    return () => {
      cancelled = true;
      animation.revert();
    };
  }, [exiting]);

  return (
    <p ref={containerRef} data-celebration-headline className={className} style={style}>
      {text}
    </p>
  );
}

export function DashboardView({
  fontClassName,
  hasMultipleChildrenFeature = false,
  hasAllRoutinesFeature = false,
  showBillingLinks = true,
}: {
  fontClassName: string;
  hasMultipleChildrenFeature?: boolean;
  hasAllRoutinesFeature?: boolean;
  /** Household members use the primary’s plan; hide upgrade CTAs. */
  showBillingLinks?: boolean;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const isDashboardFullscreen = isBrowserFullscreen || isFallbackFullscreen;

  useEffect(() => {
    document.body.classList.toggle(
      "dashboard-fullscreen-mode",
      isDashboardFullscreen,
    );

    return () => {
      document.body.classList.remove("dashboard-fullscreen-mode");
    };
  }, [isDashboardFullscreen]);

  const queryClient = useQueryClient();
  const toggleMutationKey = ["toggle-task-completion"];
  const dashboardQuery = useRqQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const r = await getDashboardData();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });

  useEffect(() => {
    const dto = dashboardQuery.data;
    if (!dto) return;
    const tz = dto.profile.timezone?.trim() || "UTC";
    const clientToday = calendarDateInTimezone(tz, new Date(nowMs));
    if (clientToday !== dto.today) {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    }
  }, [nowMs, dashboardQuery.data, queryClient]);

  const toggleCompletionConvex = useConvexMutation(api.completions.toggleForDay)
    .withOptimisticUpdate(optimisticToggleCompletion);
  const toggleMut = useMutation({
    mutationKey: toggleMutationKey,
    mutationFn: async (vars: { childId: string; taskId: string }) => {
      const current = dashboardQuery.data;
      if (!current) throw new Error("Dashboard is not loaded.");
      return toggleCompletionConvex({
        ownerUserId: current.dataOwnerId,
        childId: vars.childId,
        taskId: vars.taskId as Id<"tasks">,
        date: calendarDateInTimezone(current.profile.timezone),
      });
    },
    onSettled: () => invalidate(),
  });

  const pendingToggles = useMutationState<
    { childId: string; taskId: string } | undefined
  >({
    filters: { mutationKey: toggleMutationKey, status: "pending" },
    select: (mutation) =>
      mutation.state.variables as { childId: string; taskId: string } | undefined,
  });

  const pendingTaskKeys = useMemo(
    () =>
      new Set(
        pendingToggles
          .filter((vars): vars is { childId: string; taskId: string } =>
            Boolean(vars),
          )
          .map(({ childId, taskId }) => `${childId}:${taskId}`),
      ),
    [pendingToggles],
  );

  const baseDashboard = dashboardQuery.data;
  const ownerUserId = baseDashboard?.dataOwnerId;
  const dashboardDate = baseDashboard?.today;
  const childIdsConvex = useMemo(
    () => baseDashboard?.children.map((s) => s.child.id) ?? [],
    [baseDashboard],
  );
  const liveTasks = useConvexQuery(
    api.tasks.listForOwner,
    ownerUserId ? { ownerUserId, childIds: childIdsConvex } : "skip",
  );
  const liveCompletions = useConvexQuery(
    api.completions.listForDay,
    ownerUserId && dashboardDate
      ? { ownerUserId, childIds: childIdsConvex, date: dashboardDate }
      : "skip",
  );

  const data = useMemo((): DashboardDTO | undefined => {
    if (!baseDashboard) return undefined;
    if (liveTasks === undefined || liveCompletions === undefined) return baseDashboard;
    const grouped = new Map<string, TaskDTO[]>();
    for (const t of liveTasks) {
      const arr = grouped.get(t.childId) ?? [];
      arr.push(t);
      grouped.set(t.childId, arr);
    }
    const doneByChild = new Map<string, Set<string>>();
    for (const c of liveCompletions) {
      const current = doneByChild.get(c.childId) ?? new Set<string>();
      current.add(c.taskId);
      doneByChild.set(c.childId, current);
    }
    return {
      ...baseDashboard,
      children: baseDashboard.children.map((section) => ({
        ...section,
        tasks: grouped.get(section.child.id) ?? [],
        completedTaskIds: [...(doneByChild.get(section.child.id) ?? new Set())],
      })),
    };
  }, [baseDashboard, liveTasks, liveCompletions]);

  if (dashboardQuery.isLoading) {
    return (
      <p className="w-full p-8 text-center text-xl text-muted-foreground">
        Loading…
      </p>
    );
  }

  if (dashboardQuery.isError || !data) {
    return (
      <p className="w-full p-8 text-center text-xl text-red-600">
        {dashboardQuery.error instanceof Error
          ? dashboardQuery.error.message
          : "Something went wrong"}
      </p>
    );
  }

  const unhiddenOnDashboard = data.children.filter(
    (s) => !s.child.hiddenOnDashboard,
  );
  const visibleChildren = hasMultipleChildrenFeature
    ? unhiddenOnDashboard
    : unhiddenOnDashboard.slice(0, 1);
  const hasChildren = visibleChildren.length > 0;
  const hasAnyTask = visibleChildren.some((s) =>
    hasAllRoutinesFeature
      ? s.tasks.length > 0
      : s.tasks.some((t) => t.routine === "evening"),
  );
  const timezone = data.profile.timezone?.trim() || "UTC";
  const nowDate = new Date(nowMs);
  const timeLabel = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(nowDate);
  const dashboardHeading = `${timeLabel}`;

  const toggleFullscreen = async () => {
    if (isBrowserFullscreen && typeof document.exitFullscreen === "function") {
      await document.exitFullscreen();
      return;
    }

    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
      return;
    }

    if (typeof document.documentElement.requestFullscreen === "function") {
      try {
        await document.documentElement.requestFullscreen();
        setIsFallbackFullscreen(false);
        return;
      } catch {
        // Some browsers block fullscreen in specific contexts.
      }
    }

    setIsFallbackFullscreen(true);
  };

  return (
    <div
      className={`dashboard-font-scope flex w-full flex-col gap-6 px-6 py-10 pb-16 sm:px-8 ${fontClassName}`}
    >
      {toggleMut.error ? <p role="alert" className="text-center text-sm text-red-600">
        {toggleMut.error.message}
      </p> : null}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          void toggleFullscreen();
        }}
        aria-label={isDashboardFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isDashboardFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="absolute top-3 right-3 z-10 sm:top-4 sm:right-4"
      >
        {isDashboardFullscreen ? <Minimize2 /> : <Maximize2 />}
      </Button>

      <header className="flex items-center justify-end pr-10">
        <h1 className="sr-only">Daily routines</h1>
        <p
          className="text-xl font-semibold tabular-nums text-muted-foreground"
          aria-label={`Current time: ${dashboardHeading}`}
        >
          {dashboardHeading}
        </p>
      </header>

      {!hasChildren || !hasAnyTask ? (
        <p className="rounded-3xl bg-secondary px-6 py-5 text-center text-lg text-secondary-foreground">
          {!hasChildren
            ? "Your family's routines start here."
            : "No tasks yet for these routines."}{" "}
          <Link
            href="/routines"
            className="font-semibold text-brand-grape underline hover:text-brand-grape/85"
          >
            Set up routines
          </Link>
        </p>
      ) : null}

      {visibleChildren.map((section) => (
        <KidRoutineBlock
          key={section.child.id}
          section={section}
          profile={data.profile}
          nowMs={nowMs}
          hasAllRoutinesFeature={hasAllRoutinesFeature}
          showBillingLinks={showBillingLinks}
          pendingTaskKeys={pendingTaskKeys}
          toggleMut={{ mutate: toggleMut.mutate }}
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
  nowMs,
  hasAllRoutinesFeature,
  showBillingLinks,
  pendingTaskKeys,
  toggleMut,
}: {
  section: ChildSectionDTO;
  profile: ProfileDTO;
  nowMs: number;
  hasAllRoutinesFeature: boolean;
  showBillingLinks: boolean;
  pendingTaskKeys: ReadonlySet<string>;
  toggleMut: {
    mutate: (v: { childId: string; taskId: string }) => void;
  };
}) {
  const { addFireworksCelebration } = useConfetti();
  const prevAllTasksCompleteRef = useRef<boolean | undefined>(undefined);
  const [congratsVisible, setCongratsVisible] = useState(false);
  const [congratsExiting, setCongratsExiting] = useState(false);
  const congratsHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleCelebrationExitComplete = useCallback(() => {
    setCongratsVisible(false);
    setCongratsExiting(false);
  }, []);

  const at = useMemo(() => new Date(nowMs), [nowMs]);

  const naturalRoutines = useMemo(
    () => routinesVisibleForKidNow(profile, section.child, at),
    [profile, section.child, at],
  );

  const isMorningTime = naturalRoutines.includes("morning");
  const showMorningUpgradeNudge =
    !hasAllRoutinesFeature && isMorningTime;

  const allowedRoutines = useMemo(
    () =>
      routineListAllRoutinesGate(naturalRoutines, hasAllRoutinesFeature),
    [naturalRoutines, hasAllRoutinesFeature],
  );

  const tasks = useMemo(
    () => section.tasks.filter((t) => allowedRoutines.includes(t.routine)),
    [section.tasks, allowedRoutines],
  );

  const windowsLine = routineWindowsSummary(profile, section.child);
  const done = new Set(section.completedTaskIds);
  const allTasksComplete =
    tasks.length > 0 && tasks.every((t) => done.has(t.id));
  const incompleteTaskCount = tasks.filter((t) => !done.has(t.id)).length;
  const completedTaskCount = tasks.length - incompleteTaskCount;

  const celebrationText = useMemo(
    () => `Good job ${section.child.name}!`,
    [section.child.name],
  );

  useEffect(() => {
    if (prevAllTasksCompleteRef.current === undefined) {
      prevAllTasksCompleteRef.current = allTasksComplete;
      return;
    }
    if (allTasksComplete && !prevAllTasksCompleteRef.current) {
      addFireworksCelebration();
      queueMicrotask(() => {
        setCongratsExiting(false);
        setCongratsVisible(true);
        if (congratsHideTimeoutRef.current !== null) {
          clearTimeout(congratsHideTimeoutRef.current);
        }
        congratsHideTimeoutRef.current = setTimeout(() => {
          setCongratsExiting(true);
          congratsHideTimeoutRef.current = null;
        }, 5500);
      });
    }
    prevAllTasksCompleteRef.current = allTasksComplete;
  }, [allTasksComplete, addFireworksCelebration]);

  useEffect(() => {
    return () => {
      if (congratsHideTimeoutRef.current !== null) {
        clearTimeout(congratsHideTimeoutRef.current);
      }
    };
  }, []);

  if (section.tasks.length === 0) return null;

  return (
    <section className="relative flex w-full flex-col gap-6 rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-x-3 text-2xl font-bold text-foreground sm:text-3xl">
          {section.child.emoji ? (
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/60 text-4xl leading-none" aria-hidden>
              {section.child.emoji}
            </span>
          ) : null}
          {section.child.name}
        </h2>
        {tasks.length > 0 ? (
          <p className="flex items-center gap-2 rounded-full bg-secondary/60 px-4 py-2 text-sm font-semibold text-secondary-foreground">
            {isMorningTime ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            {isMorningTime ? "Morning routine" : "Evening routine"}
          </p>
        ) : null}
      </div>

      {showMorningUpgradeNudge ? (
        <p className="rounded-2xl border border-border bg-muted/80 px-4 py-4 text-center text-sm text-muted-foreground">
          It&apos;s morning routine time. Your plan shows evening tasks on this
          screen only.{" "}
          {showBillingLinks ? (
            <>
              <Link
                href="/upgrade"
                className="font-semibold text-brand-grape underline hover:text-brand-grape/85"
              >
                Upgrade
              </Link>{" "}
              to include the morning checklists here.{" "}
            </>
          ) : (
            <>
              Ask the primary account holder to upgrade to include morning
              checklists here.{" "}
            </>
          )}
          Evening tasks will still show here during the evening window (set per
          child on{" "}
          <Link
            href="/routines"
            className="font-semibold text-brand-grape underline hover:text-brand-grape/85"
          >
            Routines
          </Link>
          ).
        </p>
      ) : null}

      {tasks.length === 0 && !showMorningUpgradeNudge ? (
        <p className="rounded-2xl bg-muted px-4 py-4 text-center text-sm text-muted-foreground">
          {allowedRoutines.length === 0 ? (
            <>
              It isn&apos;t morning or evening routine time for this child. Windows:{" "}
              <span className="font-medium text-foreground">{windowsLine}</span>
              . Adjust start times under this child on the{" "}
              <Link
                href="/routines"
                className="font-semibold text-brand-grape underline hover:text-brand-grape/85"
              >
                Routines
              </Link>{" "}
              page.
            </>
          ) : (
            <>No tasks in this window yet.</>
          )}
        </p>
      ) : null}

      {tasks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <p className="font-semibold text-foreground" role="status">
              {allTasksComplete
                ? "All done. You did it!"
                : incompleteTaskCount === 1
                  ? "One more step to go!"
                  : "Every little step counts."}
            </p>
            <p className="font-medium text-muted-foreground">
              {completedTaskCount} of {tasks.length} steps complete
            </p>
          </div>
          <div
            role="progressbar"
            aria-label={`${section.child.name}'s routine progress`}
            aria-valuemin={0}
            aria-valuemax={tasks.length}
            aria-valuenow={completedTaskCount}
            aria-valuetext={`${completedTaskCount} of ${tasks.length} steps complete`}
            className="h-3 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-(--kid-done-border) transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${(completedTaskCount / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {tasks.length > 0 ? (
        <ul className="flex flex-row flex-wrap gap-3 sm:gap-4">
          {tasks.map((task, index) => (
            <li key={task.id} className="min-w-0 flex-1 basis-48">
              <TaskTapButton
                task={task}
                stepNumber={index + 1}
                complete={done.has(task.id)}
                completedTaskIcon={section.child.completedTaskIcon}
                disabled={pendingTaskKeys.has(`${section.child.id}:${task.id}`)}
                skipConfetti={
                  !done.has(task.id) && incompleteTaskCount === 1
                }
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
      ) : null}

      {congratsVisible
        ? createPortal(
            <>
              {/*
                Portaled to document.body so position:fixed is always viewport-relative
                (avoids transformed ancestors). h-dvh + safe-area insets fix mobile
                browser chrome / notch centering. z-65 scrim below fireworks (80); z-200
                headline above particles.
              */}
              <div
                className={cn(
                  "fixed top-0 left-0 z-65 box-border h-dvh w-full bg-linear-to-b from-[#1a2744]/88 via-[#243B6B]/82 to-[#18253F]/90 backdrop-blur-[2px] transition-opacity duration-500 ease-out",
                  congratsExiting ? "opacity-0" : "opacity-100",
                )}
                aria-hidden
              />
              <div
                className="pointer-events-none fixed top-0 left-0 z-200 box-border flex h-dvh w-full flex-col items-center justify-center pl-[max(1.5rem,env(safe-area-inset-left,0px))] pr-[max(1.5rem,env(safe-area-inset-right,0px))] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
                aria-live="polite"
                aria-atomic="true"
              >
                <CelebrationHeadline
                  text={celebrationText}
                  exiting={congratsExiting}
                  onExitComplete={handleCelebrationExitComplete}
                  className="w-full max-w-[min(92vw,40rem)] text-balance wrap-anywhere text-center font-bold text-5xl leading-tight sm:text-6xl md:text-7xl lg:text-8xl"
                  style={{
                    color: "#fff6e8",
                    fontFamily: "var(--font-heading, inherit)",
                    filter:
                      "drop-shadow(0 1px 1.5px rgba(24, 37, 63, 0.98)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.92)) drop-shadow(0 5px 18px rgba(0, 0, 0, 0.82)) drop-shadow(0 10px 40px rgba(0, 0, 0, 0.65))",
                  }}
                />
              </div>
            </>,
            document.body,
          )
        : null}
    </section>
  );
}

function TaskTapButton({
  task,
  stepNumber,
  complete,
  completedTaskIcon,
  disabled,
  skipConfetti,
  onTap,
}: {
  task: { id: string; title: string; routine: Routine };
  stepNumber: number;
  complete: boolean;
  completedTaskIcon: CompletedTaskIconId;
  disabled: boolean;
  /** When this tap finishes the child's visible checklist, fireworks handle celebration */
  skipConfetti?: boolean;
  onTap: () => void;
}) {
  const { addConfetti } = useConfetti();
  const suppressNextClickRef = useRef(false);
  const fireTap = useCallback(() => {
    onTap();
    if (!complete && !skipConfetti) {
      addConfetti();
    }
  }, [onTap, complete, skipConfetti, addConfetti]);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={complete}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") {
          e.preventDefault();
        }
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== "touch") return;
        e.preventDefault();
        suppressNextClickRef.current = true;
        fireTap();
      }}
      onClick={(e) => {
        e.preventDefault();
        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false;
          return;
        }
        fireTap();
      }}
      className={`group relative flex h-full min-h-30 w-full touch-none select-none items-center justify-center gap-3 rounded-3xl border-2 px-4 py-5 text-left text-lg font-bold leading-snug shadow-[0_5px_0_var(--task-edge),inset_0_2px_0_rgba(255,255,255,0.6)] transition-[background-color,border-color,transform,box-shadow] duration-200 hover:-translate-y-1 active:translate-y-1 active:scale-[0.97] active:shadow-[0_1px_0_var(--task-edge)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transform-none sm:min-h-34 sm:px-5 sm:text-xl ${
        complete
          ? "border-(--kid-done-border) bg-(--kid-done-bg) text-(--kid-done-fg)"
          : "border-(--kid-todo-border) bg-(--kid-todo-bg) text-(--kid-todo-fg) hover:brightness-[0.97]"
      } disabled:pointer-events-none disabled:opacity-60`}
      style={{
        "--task-edge": complete ? "var(--kid-done-border)" : "var(--kid-todo-border)",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      } as CSSProperties}
    >
      {complete ? (
        <span
          className="pointer-events-none absolute -top-3 -right-2 z-1 text-4xl leading-none -rotate-12 animate-in zoom-in-50 fade-in duration-300"
          aria-hidden
        >
          <CompletedTaskIconGraphic iconId={completedTaskIcon} />
        </span>
      ) : null}
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/35 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-transform duration-200 group-hover:rotate-[-8deg] group-active:scale-90 motion-reduce:transform-none">
        {complete ? <Check className="size-5" strokeWidth={3} /> : stepNumber}
      </span>
      <span className="min-w-0 line-clamp-3 wrap-break-word px-1">{task.title}</span>
      {complete ? <Sparkles className="pointer-events-none absolute right-3 bottom-3 size-4 opacity-50" aria-hidden /> : null}
    </button>
  );
}
