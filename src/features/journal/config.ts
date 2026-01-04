import { BookMarked, Calendar, Search, BarChart3, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ToolConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const toolConfig: Record<string, ToolConfig> = {
  save_journal_entry: {
    icon: BookMarked,
    label: "Saving entry",
    color: "text-green-500",
  },
  get_recent_entries: {
    icon: Calendar,
    label: "Loading entries",
    color: "text-blue-500",
  },
  search_entries: {
    icon: Search,
    label: "Searching",
    color: "text-purple-500",
  },
  get_entry_stats: {
    icon: BarChart3,
    label: "Getting stats",
    color: "text-orange-500",
  },
};

export const defaultToolConfig: ToolConfig = {
  icon: Loader2,
  label: "Processing",
  color: "text-muted-foreground",
};

export function getToolConfig(toolName: string): ToolConfig {
  return toolConfig[toolName] || { ...defaultToolConfig, label: toolName };
}
