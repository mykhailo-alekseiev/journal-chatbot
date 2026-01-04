import type { ToolUIPart } from "ai";
import { Loader2, Check, AlertCircle, Calendar, Search, BarChart3 } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  getToolConfig,
  isSaveEntryResult,
  isRecentEntriesResult,
  isSearchResult,
  isStatsResult,
} from "~/features/journal";

interface Props {
  part: ToolUIPart;
}

export function ToolInvocationDisplay({ part }: Props) {
  // toolName is encoded in type: "tool-{toolName}"
  const toolName = part.type.slice(5);
  const state = part.state;
  const isLoading = state === "input-streaming" || state === "input-available";
  const hasError = state === "output-error";
  const result = state === "output-available" ? part.output : null;

  const config = getToolConfig(toolName);
  const Icon = config.icon;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="size-4 animate-spin" />
        <span>{config.label}...</span>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="flex items-center gap-2 text-sm py-2 text-red-500">
        <AlertCircle className="size-4" />
        <span>
          {config.label} failed: {part.errorText || "Unknown error"}
        </span>
      </div>
    );
  }

  // Save entry result
  if (toolName === "save_journal_entry" && isSaveEntryResult(result)) {
    if (result.success) {
      return (
        <div className="flex items-center gap-2 text-sm py-2 text-green-600 dark:text-green-400">
          <Check className="size-4" />
          <span>{result.created ? "Entry saved" : "Entry updated"}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm py-2 text-red-500">
        <AlertCircle className="size-4" />
        <span>Failed to save: {result.error}</span>
      </div>
    );
  }

  // Recent entries result
  if (toolName === "get_recent_entries" && isRecentEntriesResult(result)) {
    if (result.success && result.entries?.length) {
      return (
        <div className="text-sm py-2 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" />
            <span>Found {result.count} recent entries</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm py-2 text-muted-foreground">
        <Calendar className="size-4" />
        <span>No recent entries found</span>
      </div>
    );
  }

  // Search result
  if (toolName === "search_entries" && isSearchResult(result)) {
    if (result.success) {
      return (
        <div className="text-sm py-2 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="size-4" />
            <span>Found {result.count} matching entries</span>
          </div>
        </div>
      );
    }
  }

  // Stats result
  if (toolName === "get_entry_stats" && isStatsResult(result)) {
    if (result.success) {
      return (
        <div className="text-sm py-2 rounded-lg bg-muted/50 px-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="size-4" />
            <span>Your journaling stats ({result.period})</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold">{result.total_entries}</div>
              <div className="text-xs text-muted-foreground">entries</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{result.streak_days}</div>
              <div className="text-xs text-muted-foreground">day streak</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{result.avg_entry_length}</div>
              <div className="text-xs text-muted-foreground">avg chars</div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div className="flex items-center gap-2 text-sm py-2 text-muted-foreground">
      <Icon className={cn("size-4", config.color)} />
      <span>{config.label} complete</span>
    </div>
  );
}
