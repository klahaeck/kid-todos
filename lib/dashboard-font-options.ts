export const DASHBOARD_FONT_IDS = [
  "geist",
  "fredoka",
  "baloo2",
  "patrickhand",
  "comicneue",
  "balsamiqsans",
  "chewy",
  "delius",
  "comfortaa",
  "atmakrishnan",
] as const;

export type DashboardFontId = (typeof DASHBOARD_FONT_IDS)[number];

export const DEFAULT_DASHBOARD_FONT: DashboardFontId = "geist";

export function normalizeDashboardFont(raw: unknown): DashboardFontId {
  if (
    typeof raw === "string" &&
    (DASHBOARD_FONT_IDS as readonly string[]).includes(raw)
  ) {
    return raw as DashboardFontId;
  }
  return DEFAULT_DASHBOARD_FONT;
}

export const DASHBOARD_FONT_OPTIONS: {
  id: DashboardFontId;
  label: string;
  description: string;
}[] = [
  {
    id: "geist",
    label: "Geist (default)",
    description: "Clean and easy to read",
  },
  {
    id: "fredoka",
    label: "Fredoka",
    description: "Round and playful",
  },
  {
    id: "baloo2",
    label: "Baloo 2",
    description: "Big, bubbly letters",
  },
  {
    id: "patrickhand",
    label: "Patrick Hand",
    description: "Friendly handwriting style",
  },
  {
    id: "comicneue",
    label: "Comic Neue",
    description: "Comic style with clear letters",
  },
  {
    id: "balsamiqsans",
    label: "Balsamiq Sans",
    description: "Chunky and friendly with clear shapes",
  },
  {
    id: "chewy",
    label: "Chewy",
    description: "Fun, bouncy letters",
  },
  {
    id: "delius",
    label: "Delius",
    description: "Soft handwritten style",
  },
  {
    id: "comfortaa",
    label: "Comfortaa",
    description: "Rounded geometric letters",
  },
  {
    id: "atmakrishnan",
    label: "Atma (Krishnan)",
    description: "Playful hand-drawn look",
  },
];
