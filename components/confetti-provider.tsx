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

  const clearCanvas = useCallback(() => {
    containerRef.current?.particles.clear();
  }, []);

  const value = useMemo(
    () => ({
      addConfetti,
      addConfettiAtPosition,
      clearCanvas,
    }),
    [addConfetti, addConfettiAtPosition, clearCanvas],
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
