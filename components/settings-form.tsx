"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/app/actions/profile";
import { queryKeys } from "@/lib/query-keys";
import type { ProfileDTO } from "@/lib/types";
import { applyColorThemeToDocument } from "@/lib/apply-theme";
import {
  COLOR_THEME_OPTIONS,
  type ColorThemeId,
} from "@/lib/color-themes";
import {
  DASHBOARD_FONT_OPTIONS,
  type DashboardFontId,
} from "@/lib/dashboard-font-options";
import { getDashboardFontClassName } from "@/lib/dashboard-fonts";
import { getLocalTimeZone } from "@/lib/timezone";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const IANA_TIMEZONES: string[] = (() => {
  try {
    return [...Intl.supportedValuesOf("timeZone")].sort((a, b) =>
      a.localeCompare(b),
    );
  } catch {
    return ["UTC"];
  }
})();

/** 24h HH:mm in 15-minute steps (matches routine windows UX). */
const QUARTER_HOUR_TIMES: string[] = (() => {
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

function mergeHmOptions(extras: (string | undefined)[]): string[] {
  const set = new Set(QUARTER_HOUR_TIMES);
  for (const t of extras) {
    if (t && /^\d{2}:\d{2}$/.test(t)) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

type TimeHmFieldProps = {
  id: string;
  label: string;
  name: string;
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
};

function TimeHmField({
  id,
  label,
  name,
  value,
  onValueChange,
  options,
}: TimeHmFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value || null}
        onValueChange={(v) => onValueChange(v ?? "")}
      >
        <SelectTrigger
          id={id}
          className="h-auto w-full min-w-0 rounded-xl py-2"
        >
          <SelectValue placeholder="Not set" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="">Not set</SelectItem>
          {options.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function profileSettingsKey(p: ProfileDTO) {
  return [
    p.colorTheme,
    p.dashboardFont,
    p.timezone,
    p.morningStart,
    p.morningEnd,
    p.eveningStart,
    p.eveningEnd,
  ].join("\0");
}

function SettingsFormFields({
  profile,
  saveMut,
}: {
  profile: ProfileDTO;
  saveMut: UseMutationResult<unknown, Error, FormData, unknown>;
}) {
  const initialTimezone = profile.timezone?.trim()
    ? profile.timezone.trim()
    : getLocalTimeZone();
  const initialMorningStart = profile.morningStart ?? "";
  const initialMorningEnd = profile.morningEnd ?? "";
  const initialEveningStart = profile.eveningStart ?? "";
  const initialEveningEnd = profile.eveningEnd ?? "";
  const initialColorTheme = profile.colorTheme;
  const initialDashboardFont = profile.dashboardFont;

  const timezoneOptions = useMemo(() => {
    const stored = profile.timezone?.trim() ?? "";
    const ensure = stored || getLocalTimeZone();
    if (ensure && !IANA_TIMEZONES.includes(ensure)) {
      return [ensure, ...IANA_TIMEZONES];
    }
    return IANA_TIMEZONES;
  }, [profile.timezone]);

  const [timezone, setTimezone] = useState(() =>
    initialTimezone,
  );

  const timeOptions = useMemo(
    () =>
      mergeHmOptions([
        profile.morningStart,
        profile.morningEnd,
        profile.eveningStart,
        profile.eveningEnd,
      ]),
    [
      profile.morningStart,
      profile.morningEnd,
      profile.eveningStart,
      profile.eveningEnd,
    ],
  );

  const [morningStart, setMorningStart] = useState(initialMorningStart);
  const [morningEnd, setMorningEnd] = useState(initialMorningEnd);
  const [eveningStart, setEveningStart] = useState(initialEveningStart);
  const [eveningEnd, setEveningEnd] = useState(initialEveningEnd);
  const [colorTheme, setColorTheme] = useState<ColorThemeId>(
    initialColorTheme,
  );
  const [dashboardFont, setDashboardFont] = useState<DashboardFontId>(
    initialDashboardFont,
  );
  const dashboardFontPreviewClassName = useMemo(
    () => getDashboardFontClassName(dashboardFont),
    [dashboardFont],
  );

  useEffect(() => {
    applyColorThemeToDocument(colorTheme);
  }, [colorTheme]);

  const hasUnsavedChanges =
    timezone !== initialTimezone ||
    morningStart !== initialMorningStart ||
    morningEnd !== initialMorningEnd ||
    eveningStart !== initialEveningStart ||
    eveningEnd !== initialEveningEnd ||
    colorTheme !== initialColorTheme ||
    dashboardFont !== initialDashboardFont;
  const isSaveDisabled = saveMut.isPending || !hasUnsavedChanges;
  const saveButtonLabel = saveMut.isSuccess && !hasUnsavedChanges
      ? "Saved"
      : saveMut.isError
        ? "Retry save"
        : "Save changes";

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold text-foreground">Routine settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Times are 24-hour <code className="text-xs">HH:mm</code> in 15-minute
        steps; any other saved time still appears in the lists. “Today” for
        completions uses your timezone.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate(new FormData(e.currentTarget));
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="color-theme-select" className="text-muted-foreground">
            Color theme
          </Label>
          <input type="hidden" name="colorTheme" value={colorTheme} />
          <Select
            value={colorTheme}
            onValueChange={(v) => setColorTheme((v ?? "classic") as ColorThemeId)}
          >
            <SelectTrigger
              id="color-theme-select"
              className="h-auto w-full min-w-0 rounded-xl py-2"
            >
              <SelectValue placeholder="Choose a theme" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COLOR_THEME_OPTIONS.map((opt) => (
                <SelectItem key={opt.id} value={opt.id} title={opt.description}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Ocean, Sunshine, and Berry add cheerful color; Classic stays simple
            and neutral.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="dashboard-font-select"
            className="text-muted-foreground"
          >
            Dashboard font
          </Label>
          <input type="hidden" name="dashboardFont" value={dashboardFont} />
          <Select
            value={dashboardFont}
            onValueChange={(v) =>
              setDashboardFont((v ?? "geist") as DashboardFontId)
            }
          >
            <SelectTrigger
              id="dashboard-font-select"
              className="h-auto w-full min-w-0 rounded-xl py-2"
            >
              <SelectValue placeholder="Choose a dashboard font" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {DASHBOARD_FONT_OPTIONS.map((opt) => (
                <SelectItem key={opt.id} value={opt.id} title={opt.description}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This only changes text style on the kids dashboard page.
          </p>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="mb-1 text-xs text-muted-foreground">Preview</p>
            <p
              className={`text-lg text-card-foreground ${dashboardFontPreviewClassName}`}
            >
              Tap when you&apos;re done! Great job!
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="timezone-select"
            className="text-muted-foreground"
          >
            IANA timezone
          </Label>
          <input type="hidden" name="timezone" value={timezone} />
          <Select
            value={timezone || null}
            onValueChange={(v) => setTimezone(v ?? "")}
          >
            <SelectTrigger
              id="timezone-select"
              className="h-auto w-full min-w-0 rounded-xl py-2"
            >
              <SelectValue placeholder="Choose a timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="">Not set</SelectItem>
              {timezoneOptions.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TimeHmField
            id="morning-start"
            label="Morning start"
            name="morningStart"
            value={morningStart}
            onValueChange={setMorningStart}
            options={timeOptions}
          />
          <TimeHmField
            id="morning-end"
            label="Morning end"
            name="morningEnd"
            value={morningEnd}
            onValueChange={setMorningEnd}
            options={timeOptions}
          />
          <TimeHmField
            id="evening-start"
            label="Evening start"
            name="eveningStart"
            value={eveningStart}
            onValueChange={setEveningStart}
            options={timeOptions}
          />
          <TimeHmField
            id="evening-end"
            label="Evening end"
            name="eveningEnd"
            value={eveningEnd}
            onValueChange={setEveningEnd}
            options={timeOptions}
          />
        </div>
        {saveMut.isError ? (
          <p className="text-sm text-red-600">
            {saveMut.error instanceof Error
              ? saveMut.error.message
              : "Save failed"}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSaveDisabled}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveButtonLabel}
        </button>
      </form>
    </div>
  );
}

export function SettingsForm() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const r = await getProfile();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
  });

  const saveMut = useMutation({
    mutationFn: async (form: FormData) => {
      const colorThemeRaw = String(form.get("colorTheme") ?? "").trim();
      const dashboardFontRaw = String(form.get("dashboardFont") ?? "").trim();
      const timezone = String(form.get("timezone") ?? "").trim();
      const morningStart = String(form.get("morningStart") ?? "").trim();
      const morningEnd = String(form.get("morningEnd") ?? "").trim();
      const eveningStart = String(form.get("eveningStart") ?? "").trim();
      const eveningEnd = String(form.get("eveningEnd") ?? "").trim();
      const r = await updateProfile({
        colorTheme: (colorThemeRaw || "classic") as ColorThemeId,
        dashboardFont: (dashboardFontRaw || "geist") as DashboardFontId,
        timezone: timezone || undefined,
        morningStart: morningStart || undefined,
        morningEnd: morningEnd || undefined,
        eveningStart: eveningStart || undefined,
        eveningEnd: eveningEnd || undefined,
      });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  if (profileQuery.isLoading) {
    return <p className="p-6 text-muted-foreground">Loading settings…</p>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <p className="p-6 text-red-600">
        {profileQuery.error instanceof Error
          ? profileQuery.error.message
          : "Error"}
      </p>
    );
  }

  return (
    <SettingsFormFields
      key={profileSettingsKey(profileQuery.data)}
      profile={profileQuery.data}
      saveMut={saveMut}
    />
  );
}
