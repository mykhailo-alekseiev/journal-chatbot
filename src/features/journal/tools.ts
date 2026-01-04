import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/lib/database.types";
import { logTool } from "~/utils/log-tool";

type Period = "week" | "month" | "all";

export function createJournalTools(supabase: SupabaseClient<Database>, userId: string) {
  return {
    save_journal_entry: tool({
      description:
        "Save or update a journal entry. If entry_id is provided, updates existing entry. Otherwise creates new one. Call when user shares meaningful reflection.",
      inputSchema: z.object({
        entry_id: z
          .string()
          .optional()
          .describe("ID of existing entry to update (omit to create new)"),
        content: z
          .string()
          .describe("The journal entry content, written in first person from user's perspective"),
        summary: z.string().max(100).describe("One-line summary of the entry (max 100 chars)"),
        entry_date: z
          .string()
          .optional()
          .describe("ISO date (YYYY-MM-DD) if entry is about a specific date, omit for today"),
      }),
      execute: logTool(
        "save_journal_entry",
        async ({
          entry_id,
          content,
          summary,
          entry_date,
        }: {
          entry_id?: string;
          content: string;
          summary: string;
          entry_date?: string;
        }) => {
          const entryDate = entry_date || new Date().toISOString().split("T")[0];

          if (entry_id) {
            const { data, error } = await supabase
              .from("journal_entries")
              .update({
                content,
                summary,
                entry_date: entryDate,
                updated_at: new Date().toISOString(),
              })
              .eq("id", entry_id)
              .eq("user_id", userId)
              .select("id")
              .single();

            if (error) return { success: false, error: error.message };
            return { success: true, entry_id: data.id, updated: true };
          } else {
            const { data, error } = await supabase
              .from("journal_entries")
              .insert({
                user_id: userId,
                content,
                summary,
                entry_date: entryDate,
              })
              .select("id")
              .single();

            if (error) return { success: false, error: error.message };
            return { success: true, entry_id: data.id, created: true };
          }
        },
      ),
    }),

    get_recent_entries: tool({
      description:
        "Get user's recent journal entries for context and pattern recognition. Use for personalized insights or when user asks about past reflections.",
      inputSchema: z.object({
        days: z.number().min(1).max(90).default(7).describe("Number of days to look back"),
        include_full_content: z
          .boolean()
          .default(false)
          .describe("Include full entry content or just summaries"),
      }),
      execute: logTool(
        "get_recent_entries",
        async ({ days, include_full_content }: { days: number; include_full_content: boolean }) => {
          const { data, error } = await supabase
            .from("journal_entries")
            .select(
              include_full_content
                ? "id, content, summary, entry_date, created_at"
                : "id, summary, entry_date, created_at",
            )
            .eq("user_id", userId)
            .gte(
              "entry_date",
              new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            )
            .order("entry_date", { ascending: false });

          if (error) return { success: false, error: error.message };
          return { success: true, entries: data, count: data.length };
        },
      ),
    }),

    search_entries: tool({
      description:
        "Search past journal entries by keyword or topic. Works with both Ukrainian and English. Use when user asks about specific past experiences or themes.",
      inputSchema: z.object({
        query: z.string().describe("Search query - keywords or phrase to find"),
        limit: z.number().min(1).max(20).default(5).describe("Maximum entries to return"),
      }),
      execute: logTool(
        "search_entries",
        async ({ query, limit }: { query: string; limit: number }) => {
          const { data, error } = await supabase
            .from("journal_entries")
            .select("id, content, summary, entry_date")
            .eq("user_id", userId)
            .ilike("content", `%${query}%`)
            .order("entry_date", { ascending: false })
            .limit(limit);

          if (error) return { success: false, error: error.message };
          return { success: true, entries: data, count: data.length };
        },
      ),
    }),

    get_entry_stats: tool({
      description:
        "Get statistics about user's journaling habits. Use for weekly/monthly reflections or motivation.",
      inputSchema: z.object({
        period: z.enum(["week", "month", "all"]).describe("Time period for stats"),
      }),
      execute: logTool("get_entry_stats", async ({ period }: { period: Period }) => {
        const daysMap = { week: 7, month: 30, all: 365 * 10 };
        const days = daysMap[period];

        const { data, error } = await supabase
          .from("journal_entries")
          .select("id, entry_date, content")
          .eq("user_id", userId)
          .gte(
            "entry_date",
            new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          );

        if (error) return { success: false, error: error.message };

        const entries = data || [];
        const totalEntries = entries.length;
        const avgLength = entries.length
          ? Math.round(entries.reduce((sum, e) => sum + e.content.length, 0) / entries.length)
          : 0;

        // Calculate streak
        const dates = new Set(entries.map((e) => e.entry_date));
        let streak = 0;
        const checkDate = new Date();
        while (dates.has(checkDate.toISOString().split("T")[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }

        return {
          success: true,
          total_entries: totalEntries,
          streak_days: streak,
          avg_entry_length: avgLength,
          period,
        };
      }),
    }),
  };
}
