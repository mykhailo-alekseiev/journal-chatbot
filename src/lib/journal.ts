export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  summary: string | null;
  entry_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface EntryStats {
  total_entries: number;
  streak_days: number;
  avg_entry_length: number;
  period: "week" | "month" | "all";
}

export interface SaveEntryResult {
  success: boolean;
  entry_id?: string;
  error?: string;
}

export interface SearchResult {
  success: boolean;
  entries?: Pick<JournalEntry, "id" | "content" | "summary" | "entry_date">[];
  count?: number;
  error?: string;
}
