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

  const timezoneOptions = useMemo(() => {
    const stored = profile.timezone?.trim() ?? "";
    const ensure = stored || getLocalTimeZone();
    if (ensure && !IANA_TIMEZONES.includes(ensure)) {
      return [ensure, ...IANA_TIMEZONES];
    }
    return IANA_TIMEZONES;
  }, [profile.timezone]);

  const [timezone, setTimezone] = useState(() =>
    profile.timezone?.trim() ? profile.timezone.trim() : getLocalTimeZone(),
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

  const [morningStart, setMorningStart] = useState(profile.morningStart ?? "");
  const [morningEnd, setMorningEnd] = useState(profile.morningEnd ?? "");
  const [eveningStart, setEveningStart] = useState(
    profile.eveningStart ?? "",
  );
  const [eveningEnd, setEveningEnd] = useState(profile.eveningEnd ?? "");
  const [colorTheme, setColorTheme] = useState<ColorThemeId>(
    profile.colorTheme,
  );

  useEffect(() => {
    applyColorThemeToDocument(colorTheme);
  }, [colorTheme]);

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
        {saveMut.isSuccess ? (
          <p className="text-sm text-emerald-600">Saved.</p>
        ) : null}
        <button
          type="submit"
          disabled={saveMut.isPending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Save
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
      const timezone = String(form.get("timezone") ?? "").trim();
      const morningStart = String(form.get("morningStart") ?? "").trim();
      const morningEnd = String(form.get("morningEnd") ?? "").trim();
      const eveningStart = String(form.get("eveningStart") ?? "").trim();
      const eveningEnd = String(form.get("eveningEnd") ?? "").trim();
      const r = await updateProfile({
        colorTheme: (colorThemeRaw || "classic") as ColorThemeId,
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
