import { tool, ToolLoopAgent, stepCountIs, InferAgentUIMessage } from "ai";
import { z } from "zod";
import { Constants } from "~/lib/database.types";
import { today, daysAgo, nowISO, getDateSet, calculateStreak } from "~/lib/date";
import { getSupabaseServerClient } from "~/utils/supabase";
import { JOURNAL_SYSTEM_PROMPT } from "./prompts";

const moodLevels = Constants.public.Enums.mood_level;

// Helper to get authenticated user
async function getUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Tools defined at module level
export const journalTools = {
  save_entry: tool({
    description: "Create or update journal entry. Omit entry_id for new entry.",
    inputSchema: z.object({
      entry_id: z.uuid().optional().describe("ID to update, omit for new"),
      content: z.string().describe("Entry content in first person"),
      summary: z.string().max(100).describe("One-line summary, max 100 chars"),
      entry_date: z.string().optional().describe("YYYY-MM-DD, default today"),
      mood: z.enum(moodLevels).describe("Detected mood level"),
      tags: z.array(z.string()).optional().describe("1-3 category tags"),
    }),
    inputExamples: [
      {
        input: {
          content:
            "Сьогодні був продуктивний день. Закінчив проєкт і відчуваю задоволення від результату.",
          summary: "Productive day, finished project",
          mood: "happy" as const,
          tags: ["work", "achievement"],
        },
      },
      {
        input: {
          entry_id: "550e8400-e29b-41d4-a716-446655440000",
          content: "Додав вечірні роздуми про день...",
          summary: "Added evening reflection",
          mood: "neutral" as const,
        },
      },
    ],
    execute: async ({ entry_id, ...fields }) => {
      const { supabase, user } = await getUser();
      if (!user) return { success: false, error: "Unauthorized" };

      if (entry_id) {
        // Update existing entry
        const updateData = Object.fromEntries(
          Object.entries({ ...fields, updated_at: nowISO() }).filter(([_, v]) => v !== undefined),
        );

        const { data, error } = await supabase
          .from("journal_entries")
          .update(updateData)
          .eq("id", entry_id)
          .eq("user_id", user.id)
          .select("id")
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, entry_id: data.id, updated: true };
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            content: fields.content,
            summary: fields.summary,
            entry_date: fields.entry_date || today(),
            mood: fields.mood,
            tags: fields.tags,
          })
          .select("id")
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, entry_id: data.id, created: true };
      }
    },
  }),

  query_entries: tool({
    description: "Search/filter entries by date range, text, or tag",
    inputSchema: z.object({
      days: z.number().int().min(1).max(90).optional().describe("Look back N days"),
      search: z.string().optional().describe("Text search query"),
      tag: z.string().optional().describe("Filter by tag"),
      limit: z.number().int().min(1).max(20).optional().describe("Max results, default 10"),
      include_content: z.boolean().optional().describe("Include full content"),
    }),
    inputExamples: [
      { input: { days: 7, include_content: true } },
      { input: { search: "продуктивний", limit: 5 } },
      { input: { tag: "work", days: 30 } },
    ],
    execute: async ({ days, search, tag, limit = 10, include_content = false }) => {
      const { supabase, user } = await getUser();
      if (!user) return { success: false, error: "Unauthorized" };

      let query = supabase
        .from("journal_entries")
        .select(
          include_content
            ? "id, content, summary, entry_date, mood, tags"
            : "id, summary, entry_date, mood, tags",
        )
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(limit);

      if (days) query = query.gte("entry_date", daysAgo(days));
      if (search) query = query.ilike("content", `%${search}%`);
      if (tag) query = query.contains("tags", [tag]);

      const { data, error } = await query;

      if (error) return { success: false, error: error.message };
      return { success: true, entries: data, count: data.length };
    },
  }),

  analyze_journal: tool({
    description: "Get mood trends and journaling stats for a period",
    inputSchema: z.object({
      period: z.enum(["week", "month", "all"]).optional().describe("Analysis period, default week"),
    }),
    inputExamples: [
      { input: { period: "week" as const } },
      { input: { period: "month" as const } },
    ],
    execute: async ({ period = "week" }) => {
      const { supabase, user } = await getUser();
      if (!user) return { success: false, error: "Unauthorized" };

      const daysMap = { week: 7, month: 30, all: 365 * 10 } as const;
      const days = daysMap[period];

      const { data, error } = await supabase
        .from("journal_entries")
        .select("id, entry_date, content, mood, tags")
        .eq("user_id", user.id)
        .gte("entry_date", daysAgo(days));

      if (error) return { success: false, error: error.message };

      const entries = data || [];
      const totalEntries = entries.length;
      const avgLength = entries.length
        ? Math.round(entries.reduce((sum, e) => sum + e.content.length, 0) / entries.length)
        : 0;

      const dates = getDateSet(entries);
      const streak = calculateStreak(dates);

      const moodDistribution: Record<string, number> = {
        very_sad: 0,
        sad: 0,
        neutral: 0,
        happy: 0,
        very_happy: 0,
      };
      entries.forEach((e) => {
        if (e.mood) moodDistribution[e.mood]++;
      });

      const allTags = new Set<string>();
      entries.forEach((e) => e.tags?.forEach((t) => allTags.add(t)));

      return {
        success: true,
        total_entries: totalEntries,
        streak_days: streak,
        avg_entry_length: avgLength,
        mood_distribution: moodDistribution,
        unique_tags: Array.from(allTags),
        period,
      };
    },
  }),
};

// Infer tool name from journalTools
export type JournalToolName = keyof typeof journalTools;

export const journalAgent = new ToolLoopAgent({
  model: "zai/glm-4.7",
  instructions: JOURNAL_SYSTEM_PROMPT,
  tools: journalTools,

  prepareCall: async (settings) => {
    const { supabase, user } = await getUser();
    if (!user) return settings;

    const { data: recentEntries } = await supabase
      .from("journal_entries")
      .select("summary, entry_date, mood")
      .eq("user_id", user.id)
      .gte("entry_date", daysAgo(3))
      .order("entry_date", { ascending: false })
      .limit(5);

    const contextLines = recentEntries?.length
      ? recentEntries
          .map((e) => `• ${e.entry_date}: ${e.summary} (${e.mood || "no mood"})`)
          .join("\n")
      : "No recent entries.";

    return {
      ...settings,
      instructions: `${settings.instructions}\n\n[Context: Today is ${today()}]\nRecent entries:\n${contextLines}`,
    };
  },

  stopWhen: stepCountIs(10),
});

// Type inference for UI messages
export type JournalAgentUIMessage = InferAgentUIMessage<typeof journalAgent>;
