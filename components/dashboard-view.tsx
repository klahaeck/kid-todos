"use client";

import { animate, stagger } from "animejs";
import Link from "next/link";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { getDashboardData } from "@/app/actions/dashboard";
import { toggleTaskCompletionAction } from "@/app/actions/completions";
import { calendarDateInTimezone } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import type {
  ChildSectionDTO,
  DashboardDTO,
  ProfileDTO,
  Routine,
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

function splitGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [
      ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
        text,
      ),
    ].map((s) => s.segment);
  }
  return [...text];
}

/** Words vs whitespace runs — line breaks occur between runs, not inside words. */
function splitWordsAndSpace(text: string): string[] {
  return text.split(/(\s+)/).filter((p) => p.length > 0);
}

function LetterCelebrationHeadline({
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
  const wordParts = useMemo(() => splitWordsAndSpace(text), [text]);
  const onExitCompleteRef = useRef(onExitComplete);

  useEffect(() => {
    onExitCompleteRef.current = onExitComplete;
  }, [onExitComplete]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-celebration-char]");
    if (!targets.length) return;

    const animation = animate(targets, {
      opacity: [0, 1],
      y: ["0.2em", "0"],
      duration: 480,
      delay: stagger(36, { ease: "outQuad" }),
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
    const targets = root.querySelectorAll<HTMLElement>("[data-celebration-char]");
    if (!targets.length) {
      queueMicrotask(() => {
        onExitCompleteRef.current();
      });
      return;
    }

    let cancelled = false;
    const animation = animate(targets, {
      opacity: [1, 0],
      y: [0, "-0.2em"],
      duration: 380,
      delay: stagger(30, { from: "last", ease: "inQuad" }),
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
    <p ref={containerRef} className={className} style={style}>
      {wordParts.map((part, wordIndex) => {
        if (/^\s+$/.test(part)) {
          return part;
        }
        const graphemes = splitGraphemes(part);
        return (
          <span
            key={`w-${wordIndex}-${part}`}
            className="inline-block whitespace-nowrap"
          >
            {graphemes.map((segment, i) => (
              <span
                key={`${wordIndex}-${i}-${segment}`}
                data-celebration-char
                className="inline-block opacity-0 will-change-[opacity,transform]"
              >
                {segment}
              </span>
            ))}
          </span>
        );
      })}
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

  useEffect(() => {
    const dto = dashboardQuery.data;
    if (!dto) return;
    const tz = dto.profile.timezone?.trim() || "UTC";
    const clientToday = calendarDateInTimezone(tz, new Date(nowMs));
    if (clientToday !== dto.today) {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    }
  }, [nowMs, dashboardQuery.data, queryClient]);

  const updateOptimisticCompletion = (
    current: DashboardDTO | undefined,
    vars: { childId: string; taskId: string },
    forceCompleted?: boolean,
  ): DashboardDTO | undefined => {
    if (!current) return current;

    return {
      ...current,
      children: current.children.map((section) => {
        if (section.child.id !== vars.childId) return section;

        const currentlyDone = section.completedTaskIds.includes(vars.taskId);
        const nextDone = forceCompleted ?? !currentlyDone;
        const completedTaskIds = nextDone
          ? section.completedTaskIds.includes(vars.taskId)
            ? section.completedTaskIds
            : [...section.completedTaskIds, vars.taskId]
          : section.completedTaskIds.filter((id) => id !== vars.taskId);

        return {
          ...section,
          completedTaskIds,
        };
      }),
    };
  };

  const toggleMut = useMutation({
    mutationKey: toggleMutationKey,
    mutationFn: async (vars: { childId: string; taskId: string }) => {
      const r = await toggleTaskCompletionAction(vars.childId, vars.taskId);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });
      const previousDashboard = queryClient.getQueryData<DashboardDTO>(
        queryKeys.dashboard,
      );

      queryClient.setQueryData<DashboardDTO>(queryKeys.dashboard, (current) =>
        updateOptimisticCompletion(current, vars),
      );

      return { previousDashboard };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard);
      }
    },
    onSuccess: (result, vars) => {
      queryClient.setQueryData<DashboardDTO>(queryKeys.dashboard, (current) =>
        updateOptimisticCompletion(current, vars, result.completed),
      );
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

  const data = dashboardQuery.data;

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
      className={`dashboard-font-scope flex w-full flex-col gap-8 px-4 py-8 pb-16 ${fontClassName}`}
    >
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
            className="font-semibold text-brand-grape underline hover:text-brand-grape/85"
          >
            Set up routines
          </Link>
        </p>
      ) : null}

      {hasChildren && hasAnyTask ? (
        <header className="text-center">
          <h2 className="text-xl font-bold text-foreground">{dashboardHeading}</h2>
        </header>
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
    <section className="relative flex w-full flex-col gap-4 rounded-3xl border-2 border-border bg-card/90 p-5 text-card-foreground shadow-sm">
      <div className="text-center sm:text-left">
        <h2 className="flex flex-wrap items-center justify-center gap-x-2 text-2xl font-bold text-foreground">
          {section.child.emoji ? (
            <span className="inline-flex shrink-0 text-4xl leading-none" aria-hidden>
              {section.child.emoji}
            </span>
          ) : null}
          {section.child.name}
        </h2>
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
        <ul className="flex flex-row flex-wrap gap-3 sm:gap-4">
          {tasks.map((task) => (
            <li key={task.id} className="min-w-0 flex-1 basis-38 sm:basis-44">
              <TaskTapButton
                task={task}
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

      {congratsVisible ? (
        <>
          {/*
            Below fireworks (z-index 80 in confetti-provider) and headline (z-200)
            so particles and text stay visible on top. Scrim uses pointer-events-auto
            so taps don’t reach the routine buttons underneath.
          */}
          <div
            className={cn(
              "fixed inset-0 z-65 bg-linear-to-b from-[#1a2744]/88 via-[#243B6B]/82 to-[#18253F]/90 backdrop-blur-[2px] transition-opacity duration-500 ease-out",
              congratsExiting ? "opacity-0" : "opacity-100",
            )}
            aria-hidden
          />
          <div
            className="pointer-events-none fixed inset-0 z-200 flex items-center justify-center px-6"
            aria-live="polite"
            aria-atomic="true"
          >
            <LetterCelebrationHeadline
              text={celebrationText}
              exiting={congratsExiting}
              onExitComplete={handleCelebrationExitComplete}
              className="max-w-[min(92vw,40rem)] text-balance bg-linear-to-br from-[#fffef5] via-[#ffe9a8] via-35% from-10% to-[#d9a21a] bg-clip-text text-center font-bold text-transparent animate-in zoom-in-95 fade-in duration-500 text-5xl leading-tight sm:text-6xl md:text-7xl lg:text-8xl"
              style={{
                fontFamily: "var(--font-heading, inherit)",
                filter:
                  "drop-shadow(0 1px 1.5px rgba(24, 37, 63, 0.98)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.92)) drop-shadow(0 5px 18px rgba(0, 0, 0, 0.82)) drop-shadow(0 10px 40px rgba(0, 0, 0, 0.65))",
              }}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function TaskTapButton({
  task,
  complete,
  completedTaskIcon,
  disabled,
  skipConfetti,
  onTap,
}: {
  task: { id: string; title: string; routine: Routine };
  complete: boolean;
  completedTaskIcon: CompletedTaskIconId;
  disabled: boolean;
  /** When this tap finishes the child's visible checklist, fireworks handle celebration */
  skipConfetti?: boolean;
  onTap: () => void;
}) {
  const { addConfetti } = useConfetti();
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={complete}
      onClick={(e) => {
        e.preventDefault();
        onTap();
        if (!complete && !skipConfetti) {
          addConfetti();
        }
      }}
      className={`relative flex h-full min-h-17 w-full items-center justify-center rounded-3xl border-3 px-4 py-4 text-center text-lg font-bold leading-snug shadow-sm transition-all active:scale-[0.9] sm:min-h-19 sm:px-5 sm:text-xl ${
        complete
          ? "border-(--kid-done-border) bg-(--kid-done-bg) text-(--kid-done-fg)"
          : "border-(--kid-todo-border) bg-(--kid-todo-bg) text-(--kid-todo-fg) hover:brightness-[0.97]"
      } disabled:opacity-60`}
    >
      {complete ? (
        <span
          className="pointer-events-none absolute -top-2 -left-2 z-1 text-4xl leading-none sm:-top-2 sm:-left-2 sm:text-4xl -rotate-12 animate-in fade-in fade-out-0 duration-200"
          aria-hidden
        >
          <CompletedTaskIconGraphic iconId={completedTaskIcon} />
        </span>
      ) : null}
      <span className="line-clamp-3 wrap-break-word px-1">{task.title}</span>
    </button>
  );
}
