"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/app/actions/profile";
import { queryKeys } from "@/lib/query-keys";

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
      const timezone = String(form.get("timezone") ?? "").trim();
      const morningStart = String(form.get("morningStart") ?? "").trim();
      const morningEnd = String(form.get("morningEnd") ?? "").trim();
      const eveningStart = String(form.get("eveningStart") ?? "").trim();
      const eveningEnd = String(form.get("eveningEnd") ?? "").trim();
      const r = await updateProfile({
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
    return <p className="p-6 text-zinc-600">Loading settings…</p>;
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

  const p = profileQuery.data;

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Routine settings
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Times use 24-hour <code className="text-xs">HH:mm</code>. “Today” for
        completions uses your timezone.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate(new FormData(e.currentTarget));
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            IANA timezone
          </span>
          <input
            name="timezone"
            defaultValue={p.timezone}
            placeholder="e.g. America/New_York"
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Morning start</span>
            <input
              name="morningStart"
              defaultValue={p.morningStart}
              className="rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Morning end</span>
            <input
              name="morningEnd"
              defaultValue={p.morningEnd}
              className="rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Evening start</span>
            <input
              name="eveningStart"
              defaultValue={p.eveningStart}
              className="rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Evening end</span>
            <input
              name="eveningEnd"
              defaultValue={p.eveningEnd}
              className="rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
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
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save
        </button>
      </form>
    </div>
  );
}
