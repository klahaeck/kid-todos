export const COMPLETED_TASK_ICON_IDS = [
  "star",
  "check",
  "sparkles",
  "trophy",
  "heart",
  "thumbs-up",
  "rocket",
  "party",
] as const;

export type CompletedTaskIconId = (typeof COMPLETED_TASK_ICON_IDS)[number];

export const DEFAULT_COMPLETED_TASK_ICON: CompletedTaskIconId = "check";

export const COMPLETED_TASK_ICON_EMOJI: Record<CompletedTaskIconId, string> = {
  star: "⭐",
  check: "✅",
  sparkles: "✨",
  trophy: "🏆",
  heart: "❤️",
  "thumbs-up": "👍",
  rocket: "🚀",
  party: "🎉",
};

export function getCompletedTaskEmoji(id: CompletedTaskIconId): string {
  return COMPLETED_TASK_ICON_EMOJI[id] ?? COMPLETED_TASK_ICON_EMOJI.check;
}

export function normalizeCompletedTaskIcon(raw: unknown): CompletedTaskIconId {
  if (typeof raw === "string") {
    if (raw === "random") {
      return "check";
    }
    if ((COMPLETED_TASK_ICON_IDS as readonly string[]).includes(raw)) {
      return raw as CompletedTaskIconId;
    }
  }
  return DEFAULT_COMPLETED_TASK_ICON;
}

export const COMPLETED_TASK_ICON_OPTIONS: {
  id: CompletedTaskIconId;
  label: string;
  description: string;
}[] = [
  {
    id: "star",
    label: "Star",
    description: "A little shine for each finished step",
  },
  {
    id: "check",
    label: "Green check",
    description: "Clear “all done” checkmark",
  },
  {
    id: "sparkles",
    label: "Sparkles",
    description: "Magical moment",
  },
  {
    id: "trophy",
    label: "Trophy",
    description: "Big win energy",
  },
  {
    id: "heart",
    label: "Heart",
    description: "Warm and encouraging",
  },
  {
    id: "thumbs-up",
    label: "Thumbs up",
    description: "Nice work!",
  },
  {
    id: "rocket",
    label: "Rocket",
    description: "Blast off—you finished!",
  },
  {
    id: "party",
    label: "Party popper",
    description: "Mini celebration",
  },
];
