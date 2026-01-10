import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "~/utils/supabase";
import type { ChatSession, ChatSessionListItem } from "./types";

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
  .inputValidator((id: string) => id)
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
