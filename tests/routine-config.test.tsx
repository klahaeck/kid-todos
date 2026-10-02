import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getFunctionName } from "convex/server";
import { RoutineConfigView } from "@/components/routine-config-view";
import { getDashboardData } from "@/app/actions/dashboard";
import { updateChildAction } from "@/app/actions/children";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardDTO } from "@/lib/types";

const mutations = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), remove: vi.fn(), reorderForChild: vi.fn() }));
vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: (reference: Parameters<typeof getFunctionName>[0]) => mutations[getFunctionName(reference).split(":")[1] as keyof typeof mutations],
}));
vi.mock("@/app/actions/dashboard", () => ({ getDashboardData: vi.fn() }));
vi.mock("@/app/actions/children", () => ({ createChildAction: vi.fn(), deleteChildAction: vi.fn(), reorderChildrenAction: vi.fn(), updateChildAction: vi.fn() }));

const dashboard: DashboardDTO = {
  dataOwnerId: "owner", today: "2026-10-02",
  profile: { id: "profile", clerkId: "owner", colorTheme: "classic", dashboardFont: "geist", completedTaskIcon: "check", timezone: "America/Chicago" },
  children: [{
    child: { id: "child", userId: "owner", name: "Sam", emoji: "😀", completedTaskIcon: "check", sortOrder: 0, hiddenOnDashboard: false, morningStart: null, morningEnd: null, eveningStart: null, eveningEnd: null },
    completedTaskIds: [],
    tasks: [{ id: "task", childId: "child", userId: "owner", title: "Brush teeth", routine: "evening", sortOrder: 0, active: true }],
  }],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getDashboardData).mockResolvedValue({ ok: true, data: dashboard });
  vi.mocked(updateChildAction).mockResolvedValue({ ok: true, data: dashboard.children[0].child });
});
afterEach(() => cleanup());
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  client.setQueryData(queryKeys.dashboard, dashboard);
  render(<QueryClientProvider client={client}><RoutineConfigView hasAllRoutinesFeature /></QueryClientProvider>);
  return userEvent.setup();
}

test("failed task creation preserves the draft and shows the error; a successful retry clears it", async () => {
  mutations.create.mockRejectedValueOnce(new Error("Save unavailable")).mockResolvedValueOnce({});
  const user = mount();
  const input = screen.getByPlaceholderText("e.g. Brush teeth") as HTMLInputElement;
  await user.type(input, "Read a book");
  await user.click(screen.getByRole("button", { name: "Add task" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Save unavailable");
  expect(input.value).toBe("Read a book");
  await user.click(screen.getByRole("button", { name: "Add task" }));
  await waitFor(() => expect(input.value).toBe(""));
});

test("editing a task keeps the unsaved title open after an error", async () => {
  mutations.update.mockRejectedValue(new Error("Title unavailable"));
  const user = mount();
  await user.click(screen.getByRole("button", { name: "Brush teeth" }));
  const input = screen.getByDisplayValue("Brush teeth") as HTMLInputElement;
  await user.clear(input);
  await user.type(input, "New title{Enter}");
  expect((await screen.findByRole("alert")).textContent).toContain("Title unavailable");
  expect((screen.getByDisplayValue("New title") as HTMLInputElement).disabled).toBe(false);
});

test("a successful save does not erase the next task drafted while it was pending", async () => {
  let finish!: (value: unknown) => void;
  mutations.create.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const user = mount();
  const input = screen.getByPlaceholderText("e.g. Brush teeth") as HTMLInputElement;
  await user.type(input, "First task");
  await user.click(screen.getByRole("button", { name: "Add task" }));
  await user.clear(input);
  await user.type(input, "Next task");
  finish({});
  await waitFor(() => expect((screen.getByRole("button", { name: "Add task" }) as HTMLButtonElement).disabled).toBe(false));
  expect(input.value).toBe("Next task");
});

test("visibility updates never send the rendered emoji", async () => {
  const user = mount();
  await user.click(screen.getByRole("button", { name: "Visible" }));
  await waitFor(() => expect(updateChildAction).toHaveBeenCalledWith({ id: "child", hiddenOnDashboard: true }));
});

test("failed child changes are surfaced to the parent", async () => {
  vi.mocked(updateChildAction).mockResolvedValue({ ok: false, error: "Child save unavailable" });
  const user = mount();
  await user.click(screen.getByRole("button", { name: "Visible" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Child save unavailable");
});
