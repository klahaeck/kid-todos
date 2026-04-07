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
    bg: "bg-amber-200",
    fg: "text-amber-950",
    sub: "text-amber-700",
  },
  {
    title: "More calm, less nagging",
    text: "Kids tap tasks as they finish, so everyone sees progress at a glance.",
    bg: "bg-emerald-200",
    fg: "text-emerald-950",
    sub: "text-emerald-700",
  },
  {
    title: "Built for real families",
    text: "Manage multiple kids, flexible schedules, and your own timezone — all in one place.",
    bg: "bg-sky-200",
    fg: "text-sky-950",
    sub: "text-sky-700",
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
    color: "bg-orange-400",
    text: "Add your child and set a morning or evening routine.",
  },
  {
    num: "2",
    color: "bg-emerald-400",
    text: "Keep tasks short and clear — one action per step.",
  },
  {
    num: "3",
    color: "bg-sky-400",
    text: "Let your child tap each task as they complete it.",
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-amber-50 px-4 pb-16 pt-12 sm:pb-24 sm:pt-16">
        <Sparkle className="absolute top-10 left-10 size-5 text-orange-300 sm:size-7" />
        <Sparkle className="absolute top-20 right-14 size-4 text-yellow-400 sm:size-6" />
        <Sparkle className="absolute bottom-16 left-1/4 size-4 text-emerald-300" />
        <Sparkle className="absolute right-1/4 bottom-10 size-5 text-sky-300 sm:size-7" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-amber-700 shadow-sm backdrop-blur">
            ✨ A brighter routine for busy families
          </p>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
            <span className="text-amber-900">Welcome to</span>
            <br />
            <span className="text-orange-500">Starry</span>{" "}
            <span className="text-amber-500">Steps</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg font-medium text-amber-800/80 sm:text-xl">
            Help your kids build independence one small task at a time with
            simple, cheerful daily routines.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-full bg-orange-500 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-orange-600 hover:shadow-lg"
            >
              Start for free
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border-2 border-amber-300 bg-white px-6 py-3 text-base font-bold text-amber-800 transition hover:border-amber-400 hover:bg-amber-50"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:grid-cols-3 sm:py-16">
        {highlights.map((item) => (
          <article
            key={item.title}
            className={`rounded-3xl ${item.bg} p-6 shadow-sm`}
          >
            <h2 className={`text-xl font-extrabold ${item.fg}`}>
              {item.title}
            </h2>
            <p
              className={`mt-2 text-sm font-medium leading-relaxed ${item.sub}`}
            >
              {item.text}
            </p>
          </article>
        ))}
      </section>

      <section className="bg-violet-100 px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-violet-950">
              How it works
            </h2>
            <ol className="mt-6 space-y-5">
              {steps.map((step) => (
                <li key={step.num} className="flex items-start gap-4">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${step.color} text-lg font-extrabold text-white shadow-sm`}
                  >
                    {step.num}
                  </span>
                  <p className="pt-1 text-base font-medium text-violet-900">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Sample morning list
            </p>
            <ul className="mt-4 space-y-2.5">
              {sampleRoutine.map((item) => (
                <li
                  key={item.task}
                  className={`rounded-2xl border-2 px-4 py-3 text-base font-bold ${
                    item.done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-800"
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
