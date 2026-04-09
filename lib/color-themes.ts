/** Saved on profile; `classic` uses the default neutral palette in `:root`. */
export const COLOR_THEME_IDS = [
  "classic",
  "ocean",
  "sunshine",
  "berry",
] as const;

export type ColorThemeId = (typeof COLOR_THEME_IDS)[number];

export const DEFAULT_COLOR_THEME: ColorThemeId = "classic";

export function normalizeColorTheme(raw: unknown): ColorThemeId {
  if (
    typeof raw === "string" &&
    (COLOR_THEME_IDS as readonly string[]).includes(raw)
  ) {
    return raw as ColorThemeId;
  }
  return DEFAULT_COLOR_THEME;
}

export const COLOR_THEME_OPTIONS: {
  id: ColorThemeId;
  label: string;
  description: string;
}[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Sticker-stack default — lime, magenta & sun pops + black outlines",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Soft sky blues and sea-glass greens",
  },
  {
    id: "sunshine",
    label: "Sunshine",
    description: "Warm yellows and peachy coral",
  },
  {
    id: "berry",
    label: "Berry",
    description: "Lavender, pink, and grape soda purples",
  },
];
