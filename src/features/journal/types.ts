import type { Database } from "~/lib/database.types";

// Derive from generated types - single source of truth
type Tables = Database["public"]["Tables"];
export type JournalEntry = Tables["journal_entries"]["Row"];
export type JournalEntryInsert = Tables["journal_entries"]["Insert"];
export type JournalEntryUpdate = Tables["journal_entries"]["Update"];

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
  entries?: Array<Pick<JournalEntry, "id" | "summary" | "entry_date" | "created_at">>;
  count?: number;
  error?: string;
}

export interface SearchResult {
  success: boolean;
  entries?: Array<Pick<JournalEntry, "id" | "summary" | "entry_date" | "content">>;
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
