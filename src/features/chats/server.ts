import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "~/utils/supabase";
import type { ChatSession, ChatSessionListItem, ChatSessionUpdate } from "./types";
import type { Database } from "~/lib/database.types";
import { streamText, validateUIMessages } from "ai";

// Schemas
const idSchema = z.string().uuid();

const createSessionSchema = z.object({
  messages: z.array(z.unknown()),
  title: z.string().optional(),
});

const updateSessionSchema = z.object({
  id: z.string().uuid(),
  updates: z.object({
    messages: z.array(z.unknown()).optional(),
    title: z.string().optional(),
  }),
});

const generateTitleSchema = z.object({
  userMessage: z.string().min(1),
  assistantMessage: z.string().min(1),
});

// List all sessions (without messages for performance)
export const getChatSessionsFn = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, updated_at, created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data as ChatSessionListItem[];
});

// Get single session with messages
export const getChatSessionFn = createServerFn({ method: "GET" })
  .inputValidator(idSchema)
  .handler(async (ctx) => {
    const id = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw new Error(error.message);
    return data as ChatSession;
  });

// Create new session
export const createChatSessionFn = createServerFn({ method: "POST" })
  .inputValidator(createSessionSchema)
  .handler(async (ctx) => {
    const { messages, title } = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const validatedMessages = await validateUIMessages({ messages });

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        messages:
          validatedMessages as unknown as Database["public"]["Tables"]["chat_sessions"]["Insert"]["messages"],
        title: title || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChatSession;
  });

// Update session (messages and/or title)
export const updateChatSessionFn = createServerFn({ method: "POST" })
  .inputValidator(updateSessionSchema)
  .handler(async (ctx) => {
    const { id, updates } = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const dbUpdates: ChatSessionUpdate = {};
    if (updates.messages) {
      const validatedMessages = await validateUIMessages({ messages: updates.messages });
      dbUpdates.messages = validatedMessages as unknown as ChatSessionUpdate["messages"];
    }
    if (updates.title !== undefined) {
      dbUpdates.title = updates.title;
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChatSession;
  });

// Delete session
export const deleteChatSessionFn = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async (ctx) => {
    const id = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// Generate title for chat session
export const generateChatTitleFn = createServerFn({ method: "POST" })
  .inputValidator(generateTitleSchema)
  .handler(async (ctx) => {
    const { userMessage, assistantMessage } = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const result = await streamText({
      model: "zai/glm-4.7",
      system:
        "Generate a concise 3-5 word title for this chat conversation. Respond with only the title, no quotes or punctuation.",
      messages: [
        {
          role: "user",
          content: `User: ${userMessage}\n\nAssistant: ${assistantMessage}`,
        },
      ],
    });

    const title = await result.text;
    return { title: title.trim() };
  });
