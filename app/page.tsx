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

function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 28c18-22 42-22 60 0s42 22 60 0 42-22 60 0 42 22 56 0"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const brutalCard =
  "rounded-2xl border-4 border-black p-6 shadow-[6px_6px_0_0_#0a0a0a]";

const highlights = [
  {
    title: "Routines, but make it easy",
    text: "Morning + evening lists kids can tap through — no lecture, just steps.",
    className: `bg-brand-lime ${brutalCard}`,
  },
  {
    title: "Less nagging, more high-fives",
    text: "Everyone sees what’s done. You get to cheer instead of repeat yourself.",
    className: `bg-brand-sun ${brutalCard}`,
  },
  {
    title: "Built for real chaos",
    text: "Multiple kids, weird schedules, your timezone — we’ve got you.",
    className: `bg-brand-magenta text-white ${brutalCard}`,
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
    chip: "bg-brand-lime text-brand-ink border-2 border-black shadow-brutal-sm",
    text: "Add your kid + pick morning or evening.",
  },
  {
    num: "2",
    chip: "border-2 border-black bg-brand-coral text-white shadow-brutal-sm",
    text: "Keep tasks short — one silly-simple action each.",
  },
  {
    num: "3",
    chip: "border-2 border-black bg-brand-grape text-white shadow-brutal-sm",
    text: "They tap done. You celebrate. Repeat tomorrow.",
  },
];

const ctaPrimary =
  "rounded-2xl border-4 border-black bg-primary px-6 py-3 text-base font-extrabold text-primary-foreground shadow-[6px_6px_0_0_#0a0a0a] transition-[transform,box-shadow] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_0_#0a0a0a] active:translate-x-1.5 active:translate-y-1.5 active:shadow-none";

const ctaOutline =
  "rounded-2xl border-4 border-black bg-card px-6 py-3 text-base font-extrabold text-foreground shadow-[6px_6px_0_0_#0a0a0a] transition-[transform,box-shadow] hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-sun/35 hover:shadow-[4px_4px_0_0_#0a0a0a] active:translate-x-1.5 active:translate-y-1.5 active:shadow-none";

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative px-4 pb-16 pt-10 sm:pb-24 sm:pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background: `
              linear-gradient(135deg, color-mix(in oklch, var(--color-brand-lime) 35%, transparent) 0%, transparent 42%),
              linear-gradient(225deg, color-mix(in oklch, var(--color-brand-magenta) 22%, transparent) 0%, transparent 38%),
              linear-gradient(12deg, color-mix(in oklch, var(--color-brand-sun) 30%, transparent) 0%, transparent 45%)
            `,
          }}
        />
        <Sparkle className="absolute top-12 left-8 size-6 text-brand-magenta sm:size-8" />
        <Sparkle className="absolute top-24 right-10 size-5 text-brand-grape sm:size-7" />
        <Sparkle className="absolute bottom-20 left-[18%] size-5 text-brand-coral" />
        <Sparkle className="absolute right-[12%] bottom-16 size-7 text-brand-lime sm:size-9" />

        <Squiggle className="mx-auto mt-4 h-10 w-48 text-brand-coral sm:w-64" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="-rotate-2 inline-flex items-center gap-2 rounded-full border-4 border-black bg-brand-moon px-5 py-2 text-sm font-extrabold tracking-tight text-brand-ink shadow-brutal">
            <span aria-hidden>✨</span>
            let’s make routines actually fun??
          </p>

          <h1 className="font-heading mt-8 text-4xl font-extrabold tracking-tighter sm:text-6xl sm:leading-[1.05]">
            <span className="block text-brand-ink">welcome to</span>
            <span className="mt-1 block">
              <span className="text-brand-grape">Starry</span>
              <span className="text-brand-coral">Steps</span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg font-sans text-lg font-semibold leading-snug text-brand-ink/85 sm:text-xl">
            Tap-through checklists for kids. Calm structure for grown-ups. Big
            colors because why not.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button type="button" className={ctaPrimary}>
                  start free →
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button type="button" className={ctaOutline}>
                  i have an account
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className={ctaPrimary}>
                go to dashboard →
              </Link>
            </Show>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:grid-cols-3 sm:py-16">
        {highlights.map((item) => (
          <article key={item.title} className={item.className}>
            <h2 className="font-heading text-xl font-extrabold tracking-tight text-brand-ink">
              {item.title}
            </h2>
            <p className="mt-3 font-sans text-sm font-semibold leading-relaxed text-brand-ink/85">
              {item.text}
            </p>
          </article>
        ))}
      </section>

      <section className="border-y-4 border-black bg-linear-to-b from-brand-lavender/50 via-brand-moon to-background px-4 py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 sm:gap-12">
          <div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tighter text-brand-ink sm:text-4xl">
              how it works
            </h2>
            <ol className="mt-8 space-y-6">
              {steps.map((step) => (
                <li key={step.num} className="flex items-start gap-4">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${step.chip}`}
                  >
                    {step.num}
                  </span>
                  <p className="pt-2 font-sans text-base font-semibold text-brand-ink">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div
            className={`${brutalCard} rotate-1 bg-card sm:rotate-2`}
          >
            <p className="text-xs font-extrabold tracking-widest text-brand-grape uppercase">
              sample morning list
            </p>
            <ul className="mt-5 space-y-3">
              {sampleRoutine.map((item) => (
                <li
                  key={item.task}
                  className={`rounded-xl border-4 px-4 py-3 text-base font-extrabold shadow-brutal-sm ${
                    item.done
                      ? "border-black bg-brand-mint/40 text-brand-ink"
                      : "border-black bg-brand-sky/25 text-brand-ink"
                  }`}
                >
                  {item.done ? "✓ " : "○ "}
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
