import type { InferToolOutput, ToolUIPart, DynamicToolUIPart } from "ai";
import type { Database } from "~/lib/database.types";
import type { journalTools, JournalToolName } from "./agent";

// Derive from generated types - single source of truth
type Tables = Database["public"]["Tables"];
export type JournalEntry = Tables["journal_entries"]["Row"];
export type JournalEntryInsert = Tables["journal_entries"]["Insert"];
export type JournalEntryUpdate = Tables["journal_entries"]["Update"];

// Mood from DB enum
export type MoodLevel = Database["public"]["Enums"]["mood_level"];

export const MOOD_SCALE = {
  very_sad: { emoji: "😢", label: "Very Sad" },
  sad: { emoji: "😕", label: "Sad" },
  neutral: { emoji: "😐", label: "Neutral" },
  happy: { emoji: "🙂", label: "Happy" },
  very_happy: { emoji: "😄", label: "Very Happy" },
} as const;

export function getMoodConfig(mood: MoodLevel) {
  return MOOD_SCALE[mood];
}

// Tool UI part with typed output
export type JournalToolPart<T extends JournalToolName> = (ToolUIPart | DynamicToolUIPart) & {
  type: `tool-${T}`;
  output: InferToolOutput<(typeof journalTools)[T]>;
};

// Type guard for journal tool parts
export function isJournalTool<T extends JournalToolName>(
  part: ToolUIPart | DynamicToolUIPart,
  toolName: T,
): part is JournalToolPart<T> {
  return part.type === `tool-${toolName}`;
}
