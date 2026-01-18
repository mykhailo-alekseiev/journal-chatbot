import { BookMarked, Search, BarChart3, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { JournalToolName } from "./agent";

export interface ToolConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const toolConfig: Record<JournalToolName, ToolConfig> = {
  save_entry: {
    icon: BookMarked,
    label: "Saving entry",
    color: "text-green-500",
  },
  query_entries: {
    icon: Search,
    label: "Searching entries",
    color: "text-blue-500",
  },
  analyze_journal: {
    icon: BarChart3,
    label: "Analyzing journal",
    color: "text-purple-500",
  },
};

export function getToolConfig(toolName: string): ToolConfig {
  if (toolName in toolConfig) {
    return toolConfig[toolName as JournalToolName];
  }
  return { icon: Loader2, color: "text-muted-foreground", label: toolName };
}
