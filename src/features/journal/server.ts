import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "~/utils/supabase";
import type { JournalEntry, JournalEntryUpdate } from "./types";

// List all entries for the current user
export const getEntriesFn = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as JournalEntry[];
});

// Get single entry by ID
export const getEntryByIdFn = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async (ctx) => {
    const id = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw new Error(error.message);
    return data as JournalEntry;
  });

// Update entry
export const updateEntryFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; updates: JournalEntryUpdate }) => d)
  .handler(async (ctx) => {
    const { id, updates } = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("journal_entries")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as JournalEntry;
  });

// Delete entry
export const deleteEntryFn = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async (ctx) => {
    const id = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// Create entry (for manual creation via UI, not AI)
export const createEntryFn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      content: string;
      summary?: string;
      entry_date?: string;
      mood?: JournalEntry["mood"];
      tags?: string[];
    }) => d,
  )
  .handler(async (ctx) => {
    const input = ctx.data;
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        content: input.content,
        summary: input.summary || null,
        entry_date: input.entry_date || new Date().toISOString().split("T")[0],
        mood: input.mood || null,
        tags: input.tags || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as JournalEntry;
  });
