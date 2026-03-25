import type { ColorThemeId } from "@/lib/color-themes";
import { DEFAULT_COLOR_THEME } from "@/lib/color-themes";

export function applyColorThemeToDocument(theme: ColorThemeId) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (theme === DEFAULT_COLOR_THEME) {
    delete html.dataset.theme;
  } else {
    html.dataset.theme = theme;
  }
}
