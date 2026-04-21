"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ConfettiProvider } from "@/components/confetti-provider";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeApplier } from "@/components/theme-applier";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConvexClientProvider>
        <ConfettiProvider>
          <ThemeApplier />
          {children}
        </ConfettiProvider>
      </ConvexClientProvider>
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      ) : null}
    </QueryClientProvider>
  );
}
