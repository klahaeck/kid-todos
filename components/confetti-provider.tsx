"use client";

import JSConfetti from "js-confetti";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

export type ConfettiOptions = NonNullable<
  Parameters<InstanceType<typeof JSConfetti>["addConfetti"]>[0]
>;

type ConfettiContextValue = {
  addConfetti: (options?: ConfettiOptions) => Promise<void>;
  addConfettiAtPosition: (options?: ConfettiOptions) => Promise<void>;
  clearCanvas: () => void;
};

const ConfettiContext = createContext<ConfettiContextValue | null>(null);
const DEFAULT_EMOJIS = ["🌈", "⚡️", "💥", "✨", "💫", "🌸", "🦄"] as const;

function getRandomDefaultEmojis(count: number): string[] {
  const pool = [...DEFAULT_EMOJIS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function withDefaultEmojis(options?: ConfettiOptions): ConfettiOptions {
  if (options?.emojis?.length) {
    return options;
  }

  return {
    ...options,
    emojis: getRandomDefaultEmojis(3),
  };
}

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const instanceRef = useRef<JSConfetti | null>(null);

  useEffect(() => {
    instanceRef.current = new JSConfetti();
    return () => {
      instanceRef.current?.destroyCanvas();
      instanceRef.current = null;
    };
  }, []);

  const addConfetti = useCallback((options?: ConfettiOptions) => {
    const instance = instanceRef.current;
    if (!instance) return Promise.resolve();
    return instance.addConfetti(withDefaultEmojis(options));
  }, []);

  const addConfettiAtPosition = useCallback((options?: ConfettiOptions) => {
    const instance = instanceRef.current;
    if (!instance) return Promise.resolve();
    return instance.addConfettiAtPosition(withDefaultEmojis(options));
  }, []);

  const clearCanvas = useCallback(() => {
    instanceRef.current?.clearCanvas();
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
