"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { getProfile } from "@/app/actions/profile";
import { getSubscriptionFlagsAction } from "@/app/actions/subscription";
import { applyColorThemeToDocument } from "@/lib/apply-theme";
import { DEFAULT_COLOR_THEME } from "@/lib/color-themes";
import { queryKeys } from "@/lib/query-keys";

export function ThemeApplier() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const r = await getProfile();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: isLoaded && !!isSignedIn && onDashboard,
  });

  const flagsQuery = useQuery({
    queryKey: queryKeys.subscriptionFlags,
    queryFn: getSubscriptionFlagsAction,
    enabled: isLoaded && !!isSignedIn && onDashboard,
  });

  useLayoutEffect(() => {
    if (!isLoaded) return;
    if (onDashboard && isSignedIn && profileQuery.data) {
      const canTheme = flagsQuery.data?.hasAllThemesFeature ?? false;
      const t = canTheme
        ? (profileQuery.data.colorTheme ?? DEFAULT_COLOR_THEME)
        : DEFAULT_COLOR_THEME;
      applyColorThemeToDocument(t);
      return;
    }
    applyColorThemeToDocument(DEFAULT_COLOR_THEME);
  }, [
    isLoaded,
    isSignedIn,
    onDashboard,
    profileQuery.data,
    flagsQuery.data?.hasAllThemesFeature,
  ]);

  return null;
}
