/** 24h HH:mm in 15-minute steps (routine start-time pickers). */
export const QUARTER_HOUR_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      out.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }
  return out;
})();

export function mergeHmOptions(extras: (string | undefined)[]): string[] {
  const set = new Set(QUARTER_HOUR_TIMES);
  for (const t of extras) {
    if (t && /^\d{2}:\d{2}$/.test(t)) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
