import { afterEach, expect, test, vi } from "vitest";
import { formatTimeHmForLocaleInProfileZone as format } from "@/lib/format-time-hm";

afterEach(() => vi.useRealTimers());
test("wall-clock labels remain correct during the spring DST gap", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-08T12:00:00Z"));
  expect(format("02:30", "America/Chicago", "en-US")).toBe("2:30 AM");
  expect(format("02:30", "America/Chicago", "en-GB")).toBe("2:30");
  expect(format("23:45", "Pacific/Auckland", "en-US")).toBe("11:45 PM");
});
test("invalid times are left unchanged", () => {
  for (const value of ["bad", "24:00", "12:60", ""]) expect(format(value, "UTC", "en-US")).toBe(value);
});
