import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseServerClient } from "~/utils/supabase";
import { JOURNAL_SYSTEM_PROMPT, createJournalTools } from "~/features/journal";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabase = getSupabaseServerClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { messages }: { messages: UIMessage[] } = await request.json();

        // Load recent entries for context
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
          tools: createJournalTools(supabase, user.id),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
