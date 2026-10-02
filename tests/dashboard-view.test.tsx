import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardView } from "@/components/dashboard-view";
import { getDashboardData } from "@/app/actions/dashboard";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardDTO } from "@/lib/types";

const effects = vi.hoisted(() => ({
  toggle: vi.fn(),
  confetti: vi.fn(),
  fireworks: vi.fn(),
  animate: vi.fn<typeof import("animejs").animate>(),
}));
vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => ({ withOptimisticUpdate: () => effects.toggle }),
}));
vi.mock("@/app/actions/dashboard", () => ({ getDashboardData: vi.fn() }));
vi.mock("@/components/confetti-provider", () => ({
  useConfetti: () => ({ addConfetti: effects.confetti, addFireworksCelebration: effects.fireworks }),
}));
vi.mock("animejs", () => ({ animate: effects.animate }));

let dashboard: DashboardDTO;
beforeEach(() => {
  vi.clearAllMocks();
  effects.animate.mockImplementation(() => ({ revert: vi.fn(), then: vi.fn() }) as unknown as ReturnType<typeof import("animejs").animate>);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-02T20:00:00Z"));
  dashboard = {
    dataOwnerId: "owner", today: "2026-10-02",
    profile: { id: "profile", clerkId: "owner", colorTheme: "berry", dashboardFont: "fredoka", completedTaskIcon: "check", timezone: "UTC" },
    children: [{
      child: { id: "child", userId: "owner", name: "Sam", emoji: "🐱", completedTaskIcon: "rocket", sortOrder: 0, hiddenOnDashboard: false, morningStart: "06:00", morningEnd: null, eveningStart: "18:00", eveningEnd: null },
      completedTaskIds: ["morning", "toys"],
      tasks: [
        { id: "morning", childId: "child", userId: "owner", title: "Get dressed", routine: "morning", sortOrder: 0, active: true },
        { id: "toys", childId: "child", userId: "owner", title: "Put toys away", routine: "evening", sortOrder: 1, active: true },
        { id: "teeth", childId: "child", userId: "owner", title: "Brush teeth", routine: "evening", sortOrder: 2, active: true },
      ],
    }],
  };
  vi.mocked(getDashboardData).mockImplementation(async () => ({ ok: true, data: dashboard }));
  effects.toggle.mockImplementation(async ({ taskId }: { taskId: string }) => {
    const section = dashboard.children[0];
    const completedTaskIds = section.completedTaskIds.includes(taskId)
      ? section.completedTaskIds.filter((id) => id !== taskId)
      : [...section.completedTaskIds, taskId];
    dashboard = { ...dashboard, children: [{ ...section, completedTaskIds }] };
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function mount(hasAllRoutinesFeature = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  client.setQueryData(queryKeys.dashboard, dashboard);
  const view = render(
    <QueryClientProvider client={client}>
      <DashboardView fontClassName="saved-fredoka-font" hasAllRoutinesFeature={hasAllRoutinesFeature} />
    </QueryClientProvider>,
  );
  return { ...view, user: userEvent.setup() };
}

test("progress counts only this child's current routine and preserves their font and done icon", () => {
  const { container } = mount();
  const progress = screen.getByRole("progressbar", { name: "Sam's routine progress" });
  expect(progress.getAttribute("aria-valuenow")).toBe("1");
  expect(progress.getAttribute("aria-valuemax")).toBe("2");
  expect(screen.queryByRole("button", { name: "Get dressed" })).toBeNull();
  expect(screen.getByRole("button", { name: "Put toys away" }).textContent).toContain("🚀");
  expect(container.querySelector(".dashboard-font-scope")?.classList.contains("saved-fredoka-font")).toBe(true);
  expect(effects.fireworks).not.toHaveBeenCalled();
});

test("finishing the last step fills the progress bar and keeps the fireworks and animated headline", async () => {
  const { user } = mount();
  await user.click(screen.getByRole("button", { name: "Brush teeth" }));
  await waitFor(() => expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2"));
  expect(screen.getByRole("status").textContent).toBe("All done. You did it!");
  expect(effects.toggle).toHaveBeenCalledWith({ ownerUserId: "owner", childId: "child", taskId: "teeth", date: "2026-10-02" });
  expect(effects.confetti).not.toHaveBeenCalled();
  expect(effects.fireworks).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(effects.animate).toHaveBeenCalled());
});

test("the completion message stays intact and visible after the real entrance animation", async () => {
  const anime = await vi.importActual<typeof import("animejs")>("animejs");
  effects.animate.mockImplementation((targets, parameters) => {
    const animation = anime.animate(targets, parameters);
    animation.complete();
    return animation;
  });
  // Include the Tailwind utility responsible for the original invisible text.
  const utilities = document.createElement("style");
  utilities.textContent = ".text-transparent { color: transparent; } .opacity-0 { opacity: 0; }";
  document.head.append(utilities);
  try {
    const { user } = mount();
    await user.click(screen.getByRole("button", { name: "Brush teeth" }));
    await waitFor(() => {
      const headline = screen.getByText("Good job Sam!");
      const style = getComputedStyle(headline);
      expect(Number(style.opacity)).toBeCloseTo(1);
      expect(style.color).not.toBe("rgba(0, 0, 0, 0)");
      expect(style.color).not.toBe("transparent");
    }, { timeout: 2000 });
    expect(effects.fireworks).toHaveBeenCalledTimes(1);
  } finally {
    utilities.remove();
  }
});

test("intermediate completions still celebrate with confetti and undo reduces progress", async () => {
  dashboard.children[0].completedTaskIds = ["morning"];
  const { user } = mount();
  await user.click(screen.getByRole("button", { name: "Put toys away" }));
  await waitFor(() => expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1"));
  expect(effects.confetti).toHaveBeenCalledTimes(1);
  expect(effects.fireworks).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Put toys away" }));
  await waitFor(() => expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0"));
  expect(effects.confetti).toHaveBeenCalledTimes(1);
});

test("an unavailable morning routine has no misleading progress bar", () => {
  vi.setSystemTime(new Date("2026-10-02T08:00:00Z"));
  mount(false);
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.queryByRole("button", { name: "Get dressed" })).toBeNull();
  expect(screen.getByText(/It's morning routine time/)).toBeTruthy();
});
