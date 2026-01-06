import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/lib/database.types";
import { Constants } from "~/lib/database.types";
import { today, daysAgo, nowISO, getDateSet, calculateStreak } from "~/lib/date";

const moodLevels = Constants.public.Enums.mood_level;

export type JournalToolName = keyof ReturnType<typeof createJournalTools>;

export function createJournalTools(supabase: SupabaseClient<Database>, userId: string) {
  return {
    create_journal_entry: tool({
      description:
        "Create a new journal entry. Call when user shares meaningful reflection. Automatically detect mood from content and suggest relevant tags.",
      inputSchema: z.object({
        content: z
          .string()
          .describe("The journal entry content, written in first person from user's perspective"),
        summary: z.string().max(100).describe("One-line summary of the entry (max 100 chars)"),
        entry_date: z
          .string()
          .optional()
          .describe("ISO date (YYYY-MM-DD) if entry is about a specific date, omit for today"),
        mood: z
          .enum(moodLevels)
          .optional()
          .describe("Mood detected from content: very_sad, sad, neutral, happy, very_happy"),
        tags: z
          .array(z.string())
          .optional()
          .describe(
            "Tags/categories for the entry (e.g., work, health, relationships, goals, gratitude)",
          ),
      }),
      execute: async ({ content, summary, entry_date, mood, tags }) => {
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: userId,
            content,
            summary,
            entry_date: entry_date || today(),
            mood,
            tags,
          })
          .select("id")
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, entry_id: data.id, created: true };
      },
    }),

    update_journal_entry: tool({
      description:
        "Update an existing journal entry. Use when user wants to modify a previous entry.",
      inputSchema: z.object({
        entry_id: z.string().describe("ID of the entry to update"),
        content: z.string().optional().describe("Updated content (omit to keep existing)"),
        summary: z.string().max(100).optional().describe("Updated summary (omit to keep existing)"),
        entry_date: z.string().optional().describe("Updated date (omit to keep existing)"),
        mood: z.enum(moodLevels).optional().describe("Updated mood (omit to keep existing)"),
        tags: z.array(z.string()).optional().describe("Updated tags (omit to keep existing)"),
      }),
      execute: async ({ entry_id, content, summary, entry_date, mood, tags }) => {
        const updateData: Record<string, unknown> = { updated_at: nowISO() };
        if (content !== undefined) updateData.content = content;
        if (summary !== undefined) updateData.summary = summary;
        if (entry_date !== undefined) updateData.entry_date = entry_date;
        if (mood !== undefined) updateData.mood = mood;
        if (tags !== undefined) updateData.tags = tags;

        const { data, error } = await supabase
          .from("journal_entries")
          .update(updateData)
          .eq("id", entry_id)
          .eq("user_id", userId)
          .select("id")
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, entry_id: data.id, updated: true };
      },
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
      execute: async ({ days, include_full_content }) => {
        const { data, error } = await supabase
          .from("journal_entries")
          .select(
            include_full_content
              ? "id, content, summary, entry_date, created_at, mood, tags"
              : "id, summary, entry_date, created_at, mood, tags",
          )
          .eq("user_id", userId)
          .gte("entry_date", daysAgo(days))
          .order("entry_date", { ascending: false });

        if (error) return { success: false, error: error.message };
        return { success: true, entries: data, count: data.length };
      },
    }),

    search_entries: tool({
      description:
        "Search past journal entries by keyword or topic. Works with both Ukrainian and English. Use when user asks about specific past experiences or themes.",
      inputSchema: z.object({
        query: z.string().describe("Search query - keywords or phrase to find"),
        limit: z.number().min(1).max(20).default(5).describe("Maximum entries to return"),
      }),
      execute: async ({ query, limit }) => {
        const { data, error } = await supabase
          .from("journal_entries")
          .select("id, content, summary, entry_date, mood, tags")
          .eq("user_id", userId)
          .ilike("content", `%${query}%`)
          .order("entry_date", { ascending: false })
          .limit(limit);

        if (error) return { success: false, error: error.message };
        return { success: true, entries: data, count: data.length };
      },
    }),

    get_entries_by_tag: tool({
      description:
        "Get journal entries filtered by a specific tag. Use when user asks about entries related to a category.",
      inputSchema: z.object({
        tag: z.string().describe("Tag to filter by (e.g., 'work', 'health', 'gratitude')"),
        limit: z.number().min(1).max(20).default(10).describe("Maximum entries to return"),
      }),
      execute: async ({ tag, limit }) => {
        const { data, error } = await supabase
          .from("journal_entries")
          .select("id, summary, entry_date, mood, tags")
          .eq("user_id", userId)
          .contains("tags", [tag])
          .order("entry_date", { ascending: false })
          .limit(limit);

        if (error) return { success: false, error: error.message };
        return { success: true, entries: data, count: data.length, tag };
      },
    }),

    get_mood_trends: tool({
      description:
        "Analyze mood patterns over time. Use for weekly/monthly mood insights or when user asks about emotional patterns.",
      inputSchema: z.object({
        days: z.number().min(7).max(90).default(30).describe("Number of days to analyze"),
      }),
      execute: async ({ days }) => {
        const { data, error } = await supabase
          .from("journal_entries")
          .select("entry_date, mood")
          .eq("user_id", userId)
          .not("mood", "is", null)
          .gte("entry_date", daysAgo(days))
          .order("entry_date", { ascending: true });

        if (error) return { success: false, error: error.message };

        const entries = data || [];

        // Count mood distribution
        const distribution: Record<string, number> = {
          very_sad: 0,
          sad: 0,
          neutral: 0,
          happy: 0,
          very_happy: 0,
        };
        entries.forEach((e) => {
          if (e.mood) distribution[e.mood]++;
        });

        return {
          success: true,
          entries_with_mood: entries.length,
          mood_distribution: distribution,
          trend: entries.map((e) => ({ date: e.entry_date, mood: e.mood })),
          period_days: days,
        };
      },
    }),

    get_entry_stats: tool({
      description:
        "Get statistics about user's journaling habits. Use for weekly/monthly reflections or motivation.",
      inputSchema: z.object({
        period: z.enum(["week", "month", "all"]).describe("Time period for stats"),
      }),
      execute: async ({ period }) => {
        const daysMap = { week: 7, month: 30, all: 365 * 10 };
        const days = daysMap[period];

        const { data, error } = await supabase
          .from("journal_entries")
          .select("id, entry_date, content, mood, tags")
          .eq("user_id", userId)
          .gte("entry_date", daysAgo(days));

        if (error) return { success: false, error: error.message };

        const entries = data || [];
        const totalEntries = entries.length;
        const avgLength = entries.length
          ? Math.round(entries.reduce((sum, e) => sum + e.content.length, 0) / entries.length)
          : 0;

        // Calculate streak
        const dates = getDateSet(entries);
        const streak = calculateStreak(dates);

        // Collect all unique tags
        const allTags = new Set<string>();
        entries.forEach((e) => e.tags?.forEach((t) => allTags.add(t)));

        return {
          success: true,
          total_entries: totalEntries,
          streak_days: streak,
          avg_entry_length: avgLength,
          unique_tags: Array.from(allTags),
          period,
        };
      },
    }),
  };
}
