"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { getProfile } from "@/app/actions/profile";
import { applyColorThemeToDocument } from "@/lib/apply-theme";
import { DEFAULT_COLOR_THEME } from "@/lib/color-themes";
import { queryKeys } from "@/lib/query-keys";

export function ThemeApplier() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const r = await getProfile();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: isLoaded && !!isSignedIn && pathname !== "/",
  });

  useLayoutEffect(() => {
    if (!isLoaded) return;
    // Keep landing page palette stable, independent from saved app theme.
    if (pathname === "/") {
      applyColorThemeToDocument(DEFAULT_COLOR_THEME);
      return;
    }
    if (!isSignedIn) {
      applyColorThemeToDocument(DEFAULT_COLOR_THEME);
      return;
    }
    if (!profileQuery.data) return;
    const t = profileQuery.data.colorTheme ?? DEFAULT_COLOR_THEME;
    applyColorThemeToDocument(t);
  }, [isLoaded, isSignedIn, pathname, profileQuery.data]);

  return null;
}
