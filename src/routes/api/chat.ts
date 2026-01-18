import type { UIMessage } from "ai";
import { convertToModelMessages } from "ai";
import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseServerClient } from "~/utils/supabase";
import { journalAgent } from "~/features/journal";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabase = getSupabaseServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return new Response("Unauthorized", { status: 401 });

        const { messages }: { messages: UIMessage[] } = await request.json();
        const result = await journalAgent.stream({
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
