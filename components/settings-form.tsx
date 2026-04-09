"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/app/actions/profile";
import { queryKeys } from "@/lib/query-keys";
import type { ProfileDTO } from "@/lib/types";
import {
  COLOR_THEME_OPTIONS,
  DEFAULT_COLOR_THEME,
  normalizeColorTheme,
  type ColorThemeId,
} from "@/lib/color-themes";
import {
  DASHBOARD_FONT_OPTIONS,
  DEFAULT_DASHBOARD_FONT,
  normalizeDashboardFont,
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

const PREVIEW_TASKS = [
  { label: "Get dressed", done: true },
  { label: "Brush teeth", done: true },
  { label: "Pack backpack", done: false },
  { label: "Put shoes on", done: false },
];

function DashboardPreview({
  colorTheme,
  fontClassName,
}: {
  colorTheme: ColorThemeId;
  fontClassName: string;
}) {
  return (
    <div
      data-theme={colorTheme === "classic" ? undefined : colorTheme}
      className="rounded-2xl border border-border bg-background p-4"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Dashboard preview
      </p>
      <div className={fontClassName}>
        <div className="rounded-2xl border-2 border-border bg-card/90 p-4">
          <p className="text-lg font-bold text-foreground">
            <span className="mr-1.5 inline-block text-2xl leading-none align-middle" aria-hidden>
              🐻
            </span>
            Sample Kid
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PREVIEW_TASKS.map((t) => (
              <div
                key={t.label}
                className={`rounded-2xl border-3 px-3 py-3 text-center text-sm font-bold leading-snug ${
                  t.done
                    ? "border-(--kid-done-border) bg-(--kid-done-bg) text-(--kid-done-fg)"
                    : "border-(--kid-todo-border) bg-(--kid-todo-bg) text-(--kid-todo-fg)"
                }`}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function profileSettingsKey(p: ProfileDTO) {
  return [p.colorTheme, p.dashboardFont, p.timezone].join("\0");
}

/** Persists the device IANA timezone when the profile has none, so “today” matches the user without an extra Save click. */
function AutoDefaultTimezone({ profile }: { profile: ProfileDTO }) {
  const queryClient = useQueryClient();
  const ranRef = useRef(false);

  useEffect(() => {
    if (profile.timezone?.trim()) return;
    if (ranRef.current) return;
    ranRef.current = true;
    const tz = getLocalTimeZone();
    void (async () => {
      const r = await updateProfile({ timezone: tz });
      if (r.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      } else {
        ranRef.current = false;
      }
    })();
  }, [profile.timezone, queryClient]);

  return null;
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


  const hasUnsavedChanges =
    timezone !== initialTimezone ||
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
        “Today” for task completions uses your timezone. Set each child&apos;s
        morning and evening start times on the{" "}
        <Link
          href="/routines"
          className="font-medium text-brand-grape underline underline-offset-2 hover:text-brand-grape/85"
        >
          Routines
        </Link>{" "}
        page.
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
        </div>

        <DashboardPreview
          colorTheme={colorTheme}
          fontClassName={dashboardFontPreviewClassName}
        />
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="timezone-select"
            className="text-muted-foreground"
          >
            Timezone
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
            {/* Long lists + alignItemWithTrigger pin the selected row to the trigger, shifting the panel far above it. */}
            <SelectContent className="max-h-72" alignItemWithTrigger={false}>
              <SelectItem value="">Not set</SelectItem>
              {timezoneOptions.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

export function SettingsForm({
  hasAllThemesFeature,
}: {
  hasAllThemesFeature: boolean;
}) {
  const queryClient = useQueryClient();
  const [themeUpgradeOpen, setThemeUpgradeOpen] = useState(false);

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
      const r = await updateProfile({
        colorTheme: (colorThemeRaw || "classic") as ColorThemeId,
        dashboardFont: (dashboardFontRaw || "geist") as DashboardFontId,
        timezone,
      });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (!hasAllThemesFeature) {
        const ct = normalizeColorTheme(data.colorTheme);
        const df = normalizeDashboardFont(data.dashboardFont);
        if (
          ct !== DEFAULT_COLOR_THEME ||
          df !== DEFAULT_DASHBOARD_FONT
        ) {
          setThemeUpgradeOpen(true);
        }
      }
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
    <>
      <AutoDefaultTimezone profile={profileQuery.data} />
      <SettingsFormFields
        key={profileSettingsKey(profileQuery.data)}
        profile={profileQuery.data}
        saveMut={saveMut}
      />
      <Dialog.Root open={themeUpgradeOpen} onOpenChange={setThemeUpgradeOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-[opacity,backdrop-filter] duration-150 supports-backdrop-filter:backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg outline-none">
              <Dialog.Title className="text-lg font-semibold">
                Preferences saved
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Your theme and font are saved. On the free plan they do not
                appear on the kids dashboard yet—only Classic colors and the
                default font show there until your subscription includes the{" "}
                <span className="font-medium text-foreground">all_themes</span>{" "}
                feature. Upgrade to see your choices on the dashboard.
              </Dialog.Description>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Dialog.Close
                  type="button"
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Close
                </Dialog.Close>
                <Link
                  href="/upgrade"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  View plans & upgrade
                </Link>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
