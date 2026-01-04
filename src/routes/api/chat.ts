import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getSupabaseServerClient } from "~/utils/supabase";

// Debug logging helper
const isDev = process.env.NODE_ENV !== "production";

function logTool<TInput, TOutput>(
  name: string,
  fn: (input: TInput) => Promise<TOutput>,
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput) => {
    if (isDev) {
      console.log(`\n🔧 [TOOL] ${name}`);
      console.log("📥 Input:", JSON.stringify(input, null, 2));
    }
    const start = Date.now();
    try {
      const result = await fn(input);
      if (isDev) {
        console.log(`📤 Output:`, JSON.stringify(result, null, 2));
        console.log(`⏱️  Duration: ${Date.now() - start}ms\n`);
      }
      return result;
    } catch (error) {
      if (isDev) {
        console.error(`❌ Error:`, error);
        console.log(`⏱️  Duration: ${Date.now() - start}ms\n`);
      }
      throw error;
    }
  };
}

const JOURNAL_SYSTEM_PROMPT = `You are a thoughtful, empathetic AI journal assistant. Your role is to help users reflect on their experiences, emotions, and thoughts through conversation.

## Core Behaviors

1. **Guide, don't interrogate**: Ask open-ended questions naturally. One question at a time.

2. **Active listening**: Acknowledge what the user shares before asking follow-ups. Use phrases like "That sounds meaningful..." or "I hear that..."

3. **Extract entries thoughtfully**: When the user shares something significant:
   - Wait for them to fully express their thought
   - Confirm you understood correctly
   - Use save_journal_entry to preserve it
   - Let them know it's been saved

4. **Provide insights**: Use get_recent_entries and search_entries to:
   - Notice patterns ("You mentioned feeling overwhelmed last Tuesday too...")
   - Celebrate progress ("You've been journaling for 7 days straight!")
   - Offer perspective ("Looking at your recent entries, I notice...")

5. **Daily prompts**: When starting a new conversation, offer a gentle prompt:
   - "How are you feeling today?"
   - "What's on your mind?"
   - "Anything you'd like to reflect on?"

## Tone Guidelines

- Warm but not saccharine
- Curious but not prying
- Supportive but not dismissive of difficult feelings
- Concise responses (2-4 sentences typical, longer when reflecting back)

## Entry Extraction Guidelines

Save an entry when:
- User explicitly asks to save something
- User shares a complete reflection (not just venting - look for insights)
- User describes a meaningful experience with emotional resonance
- A natural pause in conversation after substantive sharing

DO NOT save:
- Casual greetings or small talk
- Half-formed thoughts the user is still processing
- When user is asking questions rather than sharing

When saving, write the entry in first person from the user's perspective, capturing the essence of what they shared with emotional accuracy.

## Language

The user may write in Ukrainian or English. Respond in the same language they use. Journal entries should be saved in the language the user expressed them.

## What NOT to do

- Don't be preachy or offer unsolicited advice
- Don't minimize emotions ("at least..." or "it could be worse")
- Don't over-pathologize normal experiences
- Don't save every message as an entry - be selective
- Don't make assumptions about what the user should feel`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabase = getSupabaseServerClient();

        // Auth check
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { messages }: { messages: UIMessage[] } = await request.json();

        // Load recent entries for context (summaries only)
        const { data: recentEntries } = await supabase
          .from("journal_entries")
          .select("summary, entry_date")
          .eq("user_id", user.id)
          .gte(
            "entry_date",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          )
          .order("entry_date", { ascending: false })
          .limit(10);

        const today = new Date().toISOString().split("T")[0];
        const contextMessage = `\n\n[Context: Today's date is ${today}.${recentEntries?.length ? ` User's recent journal summaries: ${recentEntries.map((e) => `${e.entry_date}: ${e.summary}`).join("; ")}` : ""}]`;

        const result = streamText({
          model: "zai/glm-4.7",
          system: JOURNAL_SYSTEM_PROMPT + contextMessage,
          messages: convertToModelMessages(messages),
          stopWhen: stepCountIs(5),
          tools: {
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
                  .describe(
                    "The journal entry content, written in first person from user's perspective",
                  ),
                summary: z
                  .string()
                  .max(100)
                  .describe("One-line summary of the entry (max 100 chars)"),
                entry_date: z
                  .string()
                  .optional()
                  .describe(
                    "ISO date (YYYY-MM-DD) if entry is about a specific date, omit for today",
                  ),
              }),
              execute: logTool(
                "save_journal_entry",
                async ({ entry_id, content, summary, entry_date }) => {
                  const entryDate = entry_date || new Date().toISOString().split("T")[0];

                  if (entry_id) {
                    // Update existing
                    const { data, error } = await supabase
                      .from("journal_entries")
                      .update({
                        content,
                        summary,
                        entry_date: entryDate,
                        updated_at: new Date().toISOString(),
                      })
                      .eq("id", entry_id)
                      .eq("user_id", user.id)
                      .select("id")
                      .single();

                    if (error) return { success: false, error: error.message };
                    return { success: true, entry_id: data.id, updated: true };
                  } else {
                    // Create new
                    const { data, error } = await supabase
                      .from("journal_entries")
                      .insert({
                        user_id: user.id,
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
              execute: logTool("get_recent_entries", async ({ days, include_full_content }) => {
                const { data, error } = await supabase
                  .from("journal_entries")
                  .select(
                    include_full_content
                      ? "id, content, summary, entry_date, created_at"
                      : "id, summary, entry_date, created_at",
                  )
                  .eq("user_id", user.id)
                  .gte(
                    "entry_date",
                    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                  )
                  .order("entry_date", { ascending: false });

                if (error) return { success: false, error: error.message };
                return { success: true, entries: data, count: data.length };
              }),
            }),

            search_entries: tool({
              description:
                "Search past journal entries by keyword or topic. Works with both Ukrainian and English. Use when user asks about specific past experiences or themes.",
              inputSchema: z.object({
                query: z.string().describe("Search query - keywords or phrase to find"),
                limit: z.number().min(1).max(20).default(5).describe("Maximum entries to return"),
              }),
              execute: logTool("search_entries", async ({ query, limit }) => {
                // Using ILIKE for trigram-powered search (works with uk/en)
                const { data, error } = await supabase
                  .from("journal_entries")
                  .select("id, content, summary, entry_date")
                  .eq("user_id", user.id)
                  .ilike("content", `%${query}%`)
                  .order("entry_date", { ascending: false })
                  .limit(limit);

                if (error) return { success: false, error: error.message };
                return { success: true, entries: data, count: data.length };
              }),
            }),

            get_entry_stats: tool({
              description:
                "Get statistics about user's journaling habits. Use for weekly/monthly reflections or motivation.",
              inputSchema: z.object({
                period: z.enum(["week", "month", "all"]).describe("Time period for stats"),
              }),
              execute: logTool(
                "get_entry_stats",
                async ({ period }: { period: "week" | "month" | "all" }) => {
                  const daysMap = { week: 7, month: 30, all: 365 * 10 };
                  const days = daysMap[period];

                  const { data, error } = await supabase
                    .from("journal_entries")
                    .select("id, entry_date, content")
                    .eq("user_id", user.id)
                    .gte(
                      "entry_date",
                      new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                    );

                  if (error) return { success: false, error: error.message };

                  const entries = data || [];
                  const totalEntries = entries.length;
                  const avgLength = entries.length
                    ? Math.round(
                        entries.reduce((sum, e) => sum + e.content.length, 0) / entries.length,
                      )
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
                },
              ),
            }),
          },
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
