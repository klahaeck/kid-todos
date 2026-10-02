"use client";

import { useState } from "react";
import { BookOpen, Check, CircleCheck, Moon, Shirt, Sun } from "lucide-react";

const routines = {
  evening: {
    label: "Evening",
    heading: "Time to wind down",
    time: "7:00 PM",
    tasks: ["Put toys away", "Brush teeth", "Put on pajamas", "Read together"],
  },
  morning: {
    label: "Morning",
    heading: "A fresh start",
    time: "7:00 AM",
    tasks: ["Get dressed", "Brush teeth", "Pack backpack", "Put shoes on"],
  },
};

export function RoutineDemo() {
  const [routine, setRoutine] = useState<"morning" | "evening">("evening");
  const [completed, setCompleted] = useState<
    Record<"morning" | "evening", number[]>
  >({ morning: [0], evening: [0] });
  const current = routines[routine];
  const done = completed[routine];

  function toggleTask(index: number) {
    setCompleted((previous) => ({
      ...previous,
      [routine]: previous[routine].includes(index)
        ? previous[routine].filter((task) => task !== index)
        : [...previous[routine], index],
    }));
  }

  return (
    <div className="rounded-[2rem] bg-[#eeeae0] p-5 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          A little look at their day
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 text-[0.65rem] font-semibold tracking-wider text-brand-sage uppercase">
          Interactive preview
        </span>
      </div>
      <div className="rounded-3xl border border-white bg-card p-5 shadow-[0_12px_40px_-16px_rgba(36,59,107,0.18)] sm:p-6">
        <div
          className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
          role="group"
          aria-label="Preview routine"
        >
          {(["morning", "evening"] as const).map((id) => {
            const Icon = id === "morning" ? Sun : Moon;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={routine === id}
                onClick={() => setRoutine(id)}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors ${routine === id ? "bg-card text-brand-twilight shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="size-4" aria-hidden />
                {routines[id].label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-lavender/30 text-brand-twilight">
            {routine === "evening" ? (
              <Moon className="size-5" aria-hidden />
            ) : (
              <Sun className="size-5" aria-hidden />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Alex&apos;s {current.label.toLowerCase()} routine · {current.time}
            </p>
            <h2 className="mt-1 text-xl font-bold text-brand-twilight">
              {current.heading}
            </h2>
          </div>
        </div>
        <div className="mt-5 mb-6">
          <p className="mb-2 text-xs text-muted-foreground" role="status">
            {done.length === current.tasks.length
              ? "All done. You did it!"
              : `${done.length} of ${current.tasks.length} steps complete`}
          </p>
          <div
            role="progressbar"
            aria-label="Example routine progress"
            aria-valuenow={done.length}
            aria-valuemin={0}
            aria-valuemax={current.tasks.length}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-brand-sage transition-[width] duration-300 motion-reduce:transition-none"
              style={{
                width: `${(done.length / current.tasks.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <ul className="space-y-2">
          {current.tasks.map((task, index) => {
            const isDone = done.includes(index);
            return (
              <li key={`${routine}-${task}`}>
                <button
                  type="button"
                  aria-pressed={isDone}
                  onClick={() => toggleTask(index)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${isDone ? "border-brand-sage/20 bg-brand-sage/10 text-brand-sage" : "border-border bg-card text-brand-twilight hover:bg-muted/50"}`}
                >
                  <span
                    aria-hidden
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${isDone ? "border-brand-sage bg-brand-sage text-white" : "border-input"}`}
                  >
                    {isDone ? <Check className="size-3" /> : null}
                  </span>
                  <span className="flex-1">{task}</span>
                  {index === 2 && routine === "evening" ? (
                    <Shirt className="size-4 opacity-50" aria-hidden />
                  ) : index === 3 && routine === "evening" ? (
                    <BookOpen className="size-4 opacity-50" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CircleCheck className="size-4 text-brand-sage" aria-hidden /> One
          step at a time. At their own pace.
        </p>
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Try a step above. This is an example routine.
      </p>
    </div>
  );
}
