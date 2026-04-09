import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
    </svg>
  );
}

const highlights = [
  {
    title: "Routine made easy",
    text: "Create simple morning and evening checklists your kids can actually follow.",
    bg: "bg-brand-sky/22",
    ring: "ring-brand-sky/32",
    fg: "text-brand-night",
    sub: "text-brand-twilight/85",
  },
  {
    title: "More calm, less nagging",
    text: "Kids tap tasks as they finish, so everyone sees progress at a glance.",
    bg: "bg-brand-mint/26",
    ring: "ring-brand-mint/38",
    fg: "text-brand-night",
    sub: "text-brand-twilight/85",
  },
  {
    title: "Built for real families",
    text: "Manage multiple kids, flexible schedules, and your own timezone — all in one place.",
    bg: "bg-brand-gold/22",
    ring: "ring-brand-gold/42",
    fg: "text-brand-night",
    sub: "text-brand-twilight/85",
  },
];

const sampleRoutine = [
  { task: "Get dressed", done: true },
  { task: "Brush teeth", done: true },
  { task: "Pack backpack", done: false },
  { task: "Put shoes on", done: false },
];

const steps = [
  {
    num: "1",
    chip: "bg-brand-sky text-white shadow-sm",
    text: "Add your child and set a morning or evening routine.",
  },
  {
    num: "2",
    chip: "bg-brand-mint text-brand-night shadow-sm",
    text: "Keep tasks short and clear — one action per step.",
  },
  {
    num: "3",
    chip: "bg-brand-lavender text-brand-twilight shadow-sm",
    text: "Let your child tap each task as they complete it.",
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-linear-to-b from-brand-lavender/35 via-brand-moon to-background px-4 pb-16 pt-12 sm:pb-24 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(to bottom, color-mix(in oklch, var(--color-brand-twilight) 12%, transparent) 0%, transparent 42%), radial-gradient(circle at 18% 16%, color-mix(in oklch, var(--color-brand-lavender) 38%, transparent) 0%, transparent 48%), radial-gradient(circle at 85% 8%, color-mix(in oklch, var(--color-brand-sky) 28%, transparent) 0%, transparent 40%), radial-gradient(circle at 48% 92%, color-mix(in oklch, var(--color-brand-gold) 20%, transparent) 0%, transparent 46%)",
          }}
        />
        <Sparkle className="absolute top-10 left-10 size-5 text-brand-gold/90 sm:size-7" />
        <Sparkle className="absolute top-20 right-14 size-4 text-brand-sky sm:size-6" />
        <Sparkle className="absolute bottom-16 left-1/4 size-4 text-brand-mint/90" />
        <Sparkle className="absolute right-1/4 bottom-10 size-5 text-brand-lavender/90 sm:size-7" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-cloud bg-card/90 px-4 py-1.5 text-sm font-semibold text-brand-twilight shadow-sm backdrop-blur-sm">
            <span aria-hidden>✨</span>
            Calm routines, one starry step at a time
          </p>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
            <span className="text-brand-twilight">Welcome to</span>
            <br />
            <span className="text-brand-sky">Starry</span>
            <span className="text-brand-twilight">Steps</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl font-sans text-lg font-medium text-brand-twilight/90 sm:text-xl">
            Help your kids build independence with gentle morning and evening
            flows — simple, encouraging, and easy for the whole family.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-[1.25rem] bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-[0_6px_16px_rgba(36,59,107,0.15)] transition hover:brightness-[1.03] active:scale-[0.98]"
                >
                  Start for free
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-[1.25rem] border-2 border-brand-twilight/20 bg-card px-6 py-3 text-base font-bold text-brand-twilight transition hover:border-brand-sky/50 hover:bg-brand-moon"
                >
                  I already have an account
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="rounded-[1.25rem] bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-[0_6px_16px_rgba(36,59,107,0.15)] transition hover:brightness-[1.03] active:scale-[0.98]"
              >
                Go to dashboard
              </Link>
            </Show>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:grid-cols-3 sm:py-16">
        {highlights.map((item) => (
          <article
            key={item.title}
            className={`rounded-[1.75rem] ${item.bg} p-6 shadow-sm ring-1 ${item.ring} ring-inset`}
          >
            <h2 className={`text-xl font-extrabold ${item.fg}`}>{item.title}</h2>
            <p
              className={`mt-2 font-sans text-sm font-medium leading-relaxed ${item.sub}`}
            >
              {item.text}
            </p>
          </article>
        ))}
      </section>

      <section className="bg-linear-to-b from-brand-lavender/22 via-brand-moon/75 to-background px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 sm:gap-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-brand-twilight">
              How it works
            </h2>
            <ol className="mt-6 space-y-5">
              {steps.map((step) => (
                <li key={step.num} className="flex items-start gap-4">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${step.chip}`}
                  >
                    {step.num}
                  </span>
                  <p className="pt-1.5 font-sans text-base font-medium text-brand-night/90">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[1.75rem] border border-brand-cloud bg-card p-6 shadow-[0_8px_30px_rgba(36,59,107,0.08)]">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-sky">
              Sample morning list
            </p>
            <ul className="mt-4 space-y-2.5">
              {sampleRoutine.map((item) => (
                <li
                  key={item.task}
                  className={`rounded-2xl border-2 px-4 py-3 text-base font-bold ${
                    item.done
                      ? "border-brand-mint/70 bg-brand-mint/20 text-brand-night"
                      : "border-brand-sky/40 bg-brand-sky/15 text-brand-twilight"
                  }`}
                >
                  {item.done ? "✓ " : ""}
                  {item.task}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
