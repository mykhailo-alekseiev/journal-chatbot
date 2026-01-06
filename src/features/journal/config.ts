import {
  BookMarked,
  Calendar,
  Search,
  BarChart3,
  Loader2,
  Pencil,
  Tag,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { JournalToolName } from "./tools";

export interface ToolConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const toolConfig: Record<JournalToolName, ToolConfig> = {
  create_journal_entry: {
    icon: BookMarked,
    label: "Creating entry",
    color: "text-green-500",
  },
  update_journal_entry: {
    icon: Pencil,
    label: "Updating entry",
    color: "text-yellow-500",
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
  get_entries_by_tag: {
    icon: Tag,
    label: "Filtering by tag",
    color: "text-cyan-500",
  },
  get_mood_trends: {
    icon: TrendingUp,
    label: "Analyzing mood",
    color: "text-pink-500",
  },
  get_entry_stats: {
    icon: BarChart3,
    label: "Getting stats",
    color: "text-orange-500",
  },
};

export function getToolConfig(toolName: string): ToolConfig {
  if (toolName in toolConfig) {
    return toolConfig[toolName as JournalToolName];
  }
  return { icon: Loader2, color: "text-muted-foreground", label: toolName };
}
