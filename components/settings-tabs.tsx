"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const tabClassName =
  "min-h-11 flex-1 rounded-xl px-5 py-2.5 font-heading text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-primary data-active:text-primary-foreground";

export function SettingsTabs({
  settings,
  routines,
}: {
  settings: ReactNode;
  routines: ReactNode;
}) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "routines" ? "routines" : "settings";

  function changeTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "routines") {
      params.set("tab", "routines");
    } else {
      params.delete("tab");
    }
    const query = params.toString();
    window.history.pushState(null, "", query ? `/settings?${query}` : "/settings");
  }

  return (
    <Tabs.Root value={activeTab} onValueChange={changeTab} className="flex flex-col gap-6">
      <Tabs.List
        aria-label="Settings sections"
        className="flex w-full max-w-sm gap-1 rounded-2xl bg-secondary p-1"
      >
        <Tabs.Tab value="settings" className={tabClassName}>
          Settings
        </Tabs.Tab>
        <Tabs.Tab value="routines" className={tabClassName}>
          Routines
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="settings" keepMounted className="flex flex-col gap-6 hidden:hidden">
        {settings}
      </Tabs.Panel>
      <Tabs.Panel value="routines" keepMounted className="hidden:hidden">
        {routines}
      </Tabs.Panel>
    </Tabs.Root>
  );
}
