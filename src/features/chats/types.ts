import type { Database } from "~/lib/database.types";
import type { UIMessage } from "ai";

type Tables = Database["public"]["Tables"];

export type ChatSession = Tables["chat_sessions"]["Row"];
export type ChatSessionInsert = Tables["chat_sessions"]["Insert"];
export type ChatSessionUpdate = Tables["chat_sessions"]["Update"];

// List item without messages for sidebar (performance)
export type ChatSessionListItem = Pick<ChatSession, "id" | "title" | "updated_at" | "created_at">;

// Helper to cast JSONB messages to UIMessage[]
export function parseMessages(messages: unknown): UIMessage[] {
  return (messages as UIMessage[]) || [];
}
