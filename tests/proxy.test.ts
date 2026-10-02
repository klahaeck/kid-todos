import { expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import proxy from "@/proxy";

vi.mock("@clerk/nextjs/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@clerk/nextjs/server")>();
  return { ...actual, clerkMiddleware: (callback: unknown) => callback };
});
const runProxy = proxy as unknown as (auth: { protect: () => Promise<void> }, req: NextRequest) => Promise<void>;
test.each(["/", "/privacy", "/terms", "/robots.txt", "/sitemap.xml", "/opengraph-image", "/opengraph-image/abc?123", "/household/join?token=abc", "/sign-in"])("anonymous visitors can load %s", async (path) => {
  const protect = vi.fn().mockResolvedValue(undefined);
  await runProxy({ protect }, new NextRequest(`https://starrysteps.com${path}`));
  expect(protect).not.toHaveBeenCalled();
});
test.each(["/dashboard", "/routines", "/settings", "/admin", "/api/private"])("private route %s still requires authentication", async (path) => {
  const protect = vi.fn().mockResolvedValue(undefined);
  await runProxy({ protect }, new NextRequest(`https://starrysteps.com${path}`));
  expect(protect).toHaveBeenCalledOnce();
});
