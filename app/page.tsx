import { Show, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Check, Leaf, Moon, Sun, Users } from "lucide-react";
import { RoutineDemo } from "@/components/routine-demo";
import { buttonVariants } from "@/components/ui/button-variants";

const benefits = [
  {
    icon: Sun,
    title: "A rhythm they can follow",
    text: "Simple morning and evening steps make it clear what comes next.",
    color: "bg-brand-gold/20 text-brand-twilight",
  },
  {
    icon: Leaf,
    title: "Room to do it themselves",
    text: "Let your child take the lead, one familiar, manageable task at a time.",
    color: "bg-brand-sage/15 text-brand-sage",
  },
  {
    icon: Users,
    title: "A little more calm for you",
    text: "See their progress at a glance and spend less time repeating the next step.",
    color: "bg-brand-lavender/30 text-brand-twilight",
  },
];

const steps = [
  {
    title: "Make it their routine",
    text: "Add your child and choose a few everyday tasks that fit your family.",
  },
  {
    title: "Give each day a rhythm",
    text: "Arrange the steps and set the times that work for your mornings and evenings.",
  },
  {
    title: "Let them take the next step",
    text: "Your child taps each task as they finish. You can follow along and encourage their progress.",
  },
];

function StartButton({ label = "Get started free" }: { label?: string }) {
  return (
    <>
      <Show when="signed-out">
        <SignUpButton mode="modal">
          <button type="button" className={buttonVariants({ size: "lg" })}>
            {label} <ArrowRight className="size-4" aria-hidden />
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
          Open your dashboard <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Show>
    </>
  );
}

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="mb-6 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-brand-sage uppercase">
            <Leaf className="size-4" aria-hidden /> A calmer rhythm for family
            life
          </p>
          <h1 className="max-w-xl text-5xl font-bold leading-[1.08] tracking-tight text-brand-twilight sm:text-6xl lg:text-[4.25rem]">
            Small steps.
            <br />
            <span className="text-brand-sage">Calmer days.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Help your child grow more independent. Simple, visual routines for
            smoother mornings, gentler bedtimes, and the everyday moments in
            between.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <StartButton />
            <Link
              href="#how-it-works"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-twilight underline-offset-4 hover:underline"
            >
              See how it works <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Start free with one child&apos;s evening routine.
          </p>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-6 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="size-4 text-brand-sage" aria-hidden /> Simple to
              set up
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4 text-brand-sage" aria-hidden /> Made for
              your family
            </span>
          </div>
        </div>
        <RoutineDemo />
      </section>
      <section
        aria-label="What a little routine can change"
        className="border-y border-border bg-card/60"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 sm:px-8 md:grid-cols-3 md:gap-12">
          {benefits.map(({ icon: Icon, title, text, color }) => (
            <article key={title}>
              <span
                className={`mb-4 flex size-10 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-lg font-bold text-brand-twilight">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl scroll-mt-8 px-6 py-16 sm:px-8 sm:py-20"
      >
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-sage uppercase">
            A little structure. A lot of possibility.
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand-twilight sm:text-4xl">
            A routine that feels like yours.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Start small, make space for practice, and find what works for your
            family.
          </p>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-12">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t border-border pt-6">
              <span className="text-sm font-semibold text-brand-sage">
                0{index + 1}
              </span>
              <h3 className="mt-4 text-xl font-bold text-brand-twilight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <section
        id="our-approach"
        className="mx-auto mb-16 grid max-w-6xl scroll-mt-8 gap-8 px-6 sm:mb-20 sm:px-8"
      >
        <div className="grid gap-8 rounded-3xl border border-brand-sage/15 bg-brand-sage/8 p-8 sm:p-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div>
            <Leaf className="size-7 text-brand-sage" aria-hidden />
            <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-brand-sage uppercase">
              Our approach
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-brand-twilight">
              Everyday routines.
              <br />
              Lifelong little skills.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Inspired by Montessori principles of independence, order, and
              practical life, StarrySteps gives everyday tasks a clear, familiar
              place in your child&apos;s day.
            </p>
            <p>
              You prepare the routine. They practice getting dressed, putting
              things away, and caring for themselves, with you nearby when they
              need a hand.
            </p>
            <a
              href="https://amshq.org/montessori-at-home/"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-sage underline underline-offset-4"
            >
              Explore Montessori at home{" "}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </div>
      </section>
      <section className="border-t border-border bg-card/60 px-6 py-14 text-center sm:py-16">
        <Moon className="mx-auto size-6 text-brand-sage" aria-hidden />
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand-twilight">
          A calmer day starts with one small step.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Create a simple evening routine and give your child a little more room
          to grow.
        </p>
        <div className="mt-7">
          <StartButton label="Create your first routine" />
        </div>
      </section>
    </div>
  );
}
