import type { Database } from "~/lib/database.types";

// Derive from generated types - single source of truth
type Tables = Database["public"]["Tables"];
export type JournalEntry = Tables["journal_entries"]["Row"];
export type JournalEntryInsert = Tables["journal_entries"]["Insert"];
export type JournalEntryUpdate = Tables["journal_entries"]["Update"];

// Mood scale (1-5 integers in DB, emojis in UI)
export type MoodValue = 1 | 2 | 3 | 4 | 5;

export const MOOD_SCALE = {
  1: { emoji: "😢", label: "Very Sad" },
  2: { emoji: "😕", label: "Sad" },
  3: { emoji: "😐", label: "Neutral" },
  4: { emoji: "🙂", label: "Happy" },
  5: { emoji: "😄", label: "Very Happy" },
} as const;

export function getMoodConfig(mood: MoodValue) {
  return MOOD_SCALE[mood];
}

// Computed stats - not in DB
export interface EntryStats {
  total_entries: number;
  streak_days: number;
  avg_entry_length: number;
  period: "week" | "month" | "all";
}

// Tool result types - API contracts
export interface SaveEntryResult {
  success: boolean;
  entry_id?: string;
  created?: boolean;
  updated?: boolean;
  error?: string;
}

export interface RecentEntriesResult {
  success: boolean;
  entries?: Array<
    Pick<JournalEntry, "id" | "summary" | "entry_date" | "created_at" | "mood" | "tags">
  >;
  count?: number;
  error?: string;
}

export interface SearchResult {
  success: boolean;
  entries?: Array<
    Pick<JournalEntry, "id" | "summary" | "entry_date" | "content" | "mood" | "tags">
  >;
  count?: number;
  error?: string;
}

export interface StatsResult {
  success: boolean;
  total_entries?: number;
  streak_days?: number;
  avg_entry_length?: number;
  period?: string;
  error?: string;
}

// Type guards
export function isSaveEntryResult(result: unknown): result is SaveEntryResult {
  if (typeof result !== "object" || result === null || !("success" in result)) return false;
  return "entry_id" in result || "error" in result || "created" in result || "updated" in result;
}

export function isRecentEntriesResult(result: unknown): result is RecentEntriesResult {
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    ("entries" in result || "error" in result)
  );
}

export function isSearchResult(result: unknown): result is SearchResult {
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    ("entries" in result || "error" in result)
  );
}

export function isStatsResult(result: unknown): result is StatsResult {
  return (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    ("total_entries" in result || "error" in result)
  );
}
