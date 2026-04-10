"use client";

import { confetti, type ConfettiOptions as TspConfettiOptions } from "@tsparticles/confetti";
import type { Container } from "@tsparticles/engine";
import { initParticlesEngine } from "@tsparticles/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ConfettiOptions = TspConfettiOptions;

type ConfettiContextValue = {
  addConfetti: (options?: ConfettiOptions) => Promise<void>;
  addConfettiAtPosition: (options?: ConfettiOptions) => Promise<void>;
  addFireworksCelebration: () => void;
  clearCanvas: () => void;
};

const ConfettiContext = createContext<ConfettiContextValue | null>(null);

const CONFETTI_DEFAULTS = {
  spread: 360,
  ticks: 100,
  gravity: 0,
  decay: 0.94,
  startVelocity: 30,
} as const;

const CELEBRATION_COLORS = [
  "#a864fd",
  "#29cdff",
  "#78ff44",
  "#ff718d",
  "#fdff6a",
] as const;

/** Warm gold / champagne / amber — celebration fireworks only */
const FIREWORKS_COLORS = [
  "#FFFEF8",
  "#FFF6E8",
  "#FFECC8",
  "#FFE4A8",
  "#FFD76A",
  "#F6C85F",
  "#EAB308",
  "#D4A017",
  "#C9A227",
  "#B45309",
  "#92400E",
] as const;

const FIREWORKS_SPARKLE_EMOJIS = [
  "✨",
  "⭐",
  "🌟",
  "💫",
  "🎇",
  "🎆",
  "☀️",
  "🌞",
  "💛",
  "🥇",
  "🏆",
  "👑",
] as const;

const SHOOT_DELAYS_MS = [0, 100, 200] as const;

/** `scalar` scales particle draw size (confetti bundle uses ~5px × scalar). */
const BURST_SCALAR_SHAPES = 3;
const BURST_SCALAR_EMOJI = 6;

const DEFAULT_EMOJIS = [
  "🌈",
  "⚡️",
  "💥",
  "✨",
  "💫",
  "🌸",
  "🦄",
  "🎉",
  "🎊",
  "🥳",
  "🎈",
  "⭐",
  "🌟",
  "🚀",
  "🦋",
  "🍀",
  "☀️",
  "🌙",
  "💖",
  "💛",
  "🫶",
  "🏆",
  "👏",
  "🙌",
  "🦕",
  "🐰",
  "🐻",
  "🐶",
  "🐱",
  "🎁",
  "🤩",
  "🌻",
  "🍦",
  "🎵",
  "🎸",
  "🛼",
  "🎯",
] as const;

function hasEmojiValues(options: ConfettiOptions): boolean {
  const emoji = options.shapeOptions?.emoji as { value?: unknown } | undefined;
  return Array.isArray(emoji?.value) && emoji.value.length > 0;
}

/** New array each call so every burst (and each delayed shoot) gets fresh random glyphs. */
function shuffledDefaultEmojiValues(): string[] {
  const pool = [...DEFAULT_EMOJIS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function shuffledFireworksSparkleEmojis(): string[] {
  const pool = [...FIREWORKS_SPARKLE_EMOJIS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function emojiBurstValues(extra?: ConfettiOptions): string[] {
  if (extra && hasEmojiValues(extra)) {
    const raw = (extra.shapeOptions!.emoji as { value: string[] }).value;
    return [...raw];
  }
  return shuffledDefaultEmojiValues();
}

async function shoot(extra?: ConfettiOptions): Promise<Container | undefined> {
  const base: ConfettiOptions = { ...CONFETTI_DEFAULTS, ...extra };
  const colors =
    extra?.colors !== undefined ? extra.colors : [...CELEBRATION_COLORS];

  const first = await confetti({
    ...base,
    particleCount: 30,
    scalar: BURST_SCALAR_SHAPES,
    shapes: ["circle", "square"],
    colors,
  });

  await confetti({
    ...base,
    particleCount: 20,
    scalar: BURST_SCALAR_EMOJI,
    shapes: ["emoji"],
    shapeOptions: {
      ...base.shapeOptions,
      emoji: {
        ...(typeof base.shapeOptions?.emoji === "object" &&
        base.shapeOptions.emoji !== null
          ? (base.shapeOptions.emoji as object)
          : {}),
        value: emojiBurstValues(extra),
      },
    },
  });

  return first;
}

/** Angle convention matches @tsparticles/confetti: 90° = up, 0° = right, 180° = left, 270° = down */
type FireworksBurstSpec = {
  origin: { x: number; y: number };
  angle: number;
  delayMs: number;
  spread?: number;
  startVelocity?: number;
  particleCount?: number;
};

const FIREWORKS_BURST_SPECS: ReadonlyArray<FireworksBurstSpec> = [
  /* Bottom edge — fan upward */
  { origin: { x: 0.1, y: 0.94 }, angle: 118, delayMs: 0 },
  { origin: { x: 0.32, y: 0.94 }, angle: 102, delayMs: 140 },
  { origin: { x: 0.5, y: 0.94 }, angle: 90, delayMs: 280 },
  { origin: { x: 0.68, y: 0.94 }, angle: 78, delayMs: 420 },
  { origin: { x: 0.9, y: 0.94 }, angle: 62, delayMs: 560 },
  { origin: { x: 0.22, y: 0.94 }, angle: 108, delayMs: 720 },
  { origin: { x: 0.78, y: 0.94 }, angle: 72, delayMs: 860 },
  { origin: { x: 0.5, y: 0.94 }, angle: 88, delayMs: 1000 },
  /* Top edge — shower downward */
  { origin: { x: 0.12, y: 0.06 }, angle: 268, delayMs: 80, spread: 58 },
  { origin: { x: 0.35, y: 0.05 }, angle: 272, delayMs: 200, spread: 62 },
  { origin: { x: 0.5, y: 0.04 }, angle: 270, delayMs: 340, spread: 65 },
  { origin: { x: 0.65, y: 0.05 }, angle: 268, delayMs: 480, spread: 62 },
  { origin: { x: 0.88, y: 0.06 }, angle: 274, delayMs: 620, spread: 58 },
  { origin: { x: 0.5, y: 0.07 }, angle: 270, delayMs: 800, spread: 72, particleCount: 110 },
  /* Left edge — burst inward */
  { origin: { x: 0.03, y: 0.2 }, angle: 12, delayMs: 100, spread: 52, startVelocity: 58 },
  { origin: { x: 0.02, y: 0.45 }, angle: 2, delayMs: 260, spread: 48, startVelocity: 60 },
  { origin: { x: 0.03, y: 0.72 }, angle: 352, delayMs: 420, spread: 52, startVelocity: 58 },
  { origin: { x: 0.025, y: 0.55 }, angle: 6, delayMs: 640, spread: 55, particleCount: 100 },
  /* Right edge — burst inward */
  { origin: { x: 0.97, y: 0.22 }, angle: 168, delayMs: 120, spread: 52, startVelocity: 58 },
  { origin: { x: 0.98, y: 0.48 }, angle: 178, delayMs: 300, spread: 48, startVelocity: 60 },
  { origin: { x: 0.97, y: 0.75 }, angle: 188, delayMs: 460, spread: 52, startVelocity: 58 },
  { origin: { x: 0.975, y: 0.55 }, angle: 174, delayMs: 680, spread: 55, particleCount: 100 },
];

export function ConfettiProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<Container | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;
    void initParticlesEngine(async () => {
      await confetti.init();
      if (!cancelled) {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
      for (const id of timeoutsRef.current) {
        clearTimeout(id);
      }
      timeoutsRef.current = [];
    };
  }, []);

  const addConfetti = useCallback(
    async (options?: ConfettiOptions) => {
      if (!ready) return;
      for (const delay of SHOOT_DELAYS_MS) {
        const id = setTimeout(() => {
          void shoot(options).then((c) => {
            if (c) {
              containerRef.current = c;
            }
          });
        }, delay);
        timeoutsRef.current.push(id);
      }
    },
    [ready],
  );

  const addConfettiAtPosition = useCallback(
    async (options?: ConfettiOptions) => {
      await addConfetti(options);
    },
    [addConfetti],
  );

  const addFireworksCelebration = useCallback(() => {
    if (!ready) return;
    const colors = [...FIREWORKS_COLORS];
    for (const spec of FIREWORKS_BURST_SPECS) {
      const id = setTimeout(() => {
        void confetti({
          particleCount: spec.particleCount ?? 95,
          spread: spec.spread ?? 68,
          startVelocity: spec.startVelocity ?? 62,
          angle: spec.angle,
          gravity: 1.08,
          decay: 0.91,
          drift: 0.06,
          ticks: 320,
          scalar: BURST_SCALAR_SHAPES,
          zIndex: 80,
          origin: spec.origin,
          colors,
          shapes: ["circle", "square"],
        });
      }, spec.delayMs);
      timeoutsRef.current.push(id);
    }
    const sparkleId = setTimeout(() => {
      void confetti({
        particleCount: 45,
        spread: 360,
        startVelocity: 28,
        gravity: 0.45,
        decay: 0.92,
        ticks: 220,
        scalar: BURST_SCALAR_EMOJI,
        zIndex: 80,
        origin: { x: 0.5, y: 0.32 },
        shapes: ["emoji"],
        shapeOptions: {
          emoji: { value: shuffledFireworksSparkleEmojis() },
        },
      });
    }, 450);
    timeoutsRef.current.push(sparkleId);
  }, [ready]);

  const clearCanvas = useCallback(() => {
    containerRef.current?.particles.clear();
  }, []);

  const value = useMemo(
    () => ({
      addConfetti,
      addConfettiAtPosition,
      addFireworksCelebration,
      clearCanvas,
    }),
    [addConfetti, addConfettiAtPosition, addFireworksCelebration, clearCanvas],
  );

  return (
    <ConfettiContext.Provider value={value}>{children}</ConfettiContext.Provider>
  );
}

export function useConfetti(): ConfettiContextValue {
  const ctx = useContext(ConfettiContext);
  if (!ctx) {
    throw new Error("useConfetti must be used within ConfettiProvider");
  }
  return ctx;
}
