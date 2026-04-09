import type { CompletedTaskIconId } from "@/lib/completed-task-icon-options";
import { getCompletedTaskEmoji } from "@/lib/completed-task-icon-options";
import { cn } from "@/lib/utils";

/** Renders the “done” marker as an emoji (dashboard + routine settings). */
export function CompletedTaskIconGraphic({
  iconId,
  className,
}: {
  iconId: CompletedTaskIconId;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block select-none leading-none", className)}
      aria-hidden
    >
      {getCompletedTaskEmoji(iconId)}
    </span>
  );
}
