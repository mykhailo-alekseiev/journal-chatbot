import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useChat } from "@ai-sdk/react";
import type { UIToolInvocation } from "ai";
import { z } from "zod";
import {
  LogOut,
  BookMarked,
  Calendar,
  Search,
  BarChart3,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_authed/chat")({
  component: Chat,
});

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

// Tool result types
interface SaveEntryResult {
  success: boolean;
  entry_id?: string;
  created?: boolean;
  updated?: boolean;
  error?: string;
}

interface RecentEntriesResult {
  success: boolean;
  entries?: Array<{ id: string; summary: string; entry_date: string }>;
  count?: number;
  error?: string;
}

interface SearchResult {
  success: boolean;
  entries?: Array<{ id: string; summary: string; entry_date: string; content: string }>;
  count?: number;
  error?: string;
}

interface StatsResult {
  success: boolean;
  total_entries?: number;
  streak_days?: number;
  avg_entry_length?: number;
  period?: string;
  error?: string;
}

// Tool invocation renderer - handles tool-* parts from AI SDK v5
function ToolInvocationDisplay({
  part,
}: {
  part: UIToolInvocation<{ inputSchema: z.ZodType }> & { type: string };
}) {
  // Extract tool name from type (e.g., "tool-save_journal_entry" -> "save_journal_entry")
  const toolName = part.type.startsWith("tool-") ? part.type.slice(5) : part.type;
  const isLoading = part.state === "input-streaming" || part.state === "input-available";
  const result = part.state === "output-available" ? part.output : null;
  const hasError = part.state === "output-error";

  const toolConfig: Record<string, { icon: typeof BookMarked; label: string; color: string }> = {
    save_journal_entry: {
      icon: BookMarked,
      label: "Saving entry",
      color: "text-green-500",
    },
    get_recent_entries: {
      icon: Calendar,
      label: "Loading entries",
      color: "text-blue-500",
    },
    search_entries: {
      icon: Search,
      label: "Searching",
      color: "text-purple-500",
    },
    get_entry_stats: {
      icon: BarChart3,
      label: "Getting stats",
      color: "text-orange-500",
    },
  };

  const config = toolConfig[toolName] || {
    icon: Loader2,
    label: toolName,
    color: "text-muted-foreground",
  };
  const Icon = config.icon;

  // Render based on tool type and state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="size-4 animate-spin" />
        <span>{config.label}...</span>
      </div>
    );
  }

  // Handle error state
  if (hasError) {
    return (
      <div className="flex items-center gap-2 text-sm py-2 text-red-500">
        <AlertCircle className="size-4" />
        <span>
          {config.label} failed: {part.errorText || "Unknown error"}
        </span>
      </div>
    );
  }

  // Handle results
  if (toolName === "save_journal_entry" && result) {
    const r = result as SaveEntryResult;
    if (r.success) {
      return (
        <div className="flex items-center gap-2 text-sm py-2 text-green-600 dark:text-green-400">
          <Check className="size-4" />
          <span>{r.created ? "Entry saved" : "Entry updated"}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-sm py-2 text-red-500">
          <AlertCircle className="size-4" />
          <span>Failed to save: {r.error}</span>
        </div>
      );
    }
  }

  if (toolName === "get_recent_entries" && result) {
    const r = result as RecentEntriesResult;
    if (r.success && r.entries?.length) {
      return (
        <div className="text-sm py-2 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" />
            <span>Found {r.count} recent entries</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm py-2 text-muted-foreground">
        <Calendar className="size-4" />
        <span>No recent entries found</span>
      </div>
    );
  }

  if (toolName === "search_entries" && result) {
    const r = result as SearchResult;
    if (r.success) {
      return (
        <div className="text-sm py-2 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="size-4" />
            <span>Found {r.count} matching entries</span>
          </div>
        </div>
      );
    }
  }

  if (toolName === "get_entry_stats" && result) {
    const r = result as StatsResult;
    if (r.success) {
      return (
        <div className="text-sm py-2 rounded-lg bg-muted/50 px-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="size-4" />
            <span>Your journaling stats ({r.period})</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold">{r.total_entries}</div>
              <div className="text-xs text-muted-foreground">entries</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{r.streak_days}</div>
              <div className="text-xs text-muted-foreground">day streak</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{r.avg_entry_length}</div>
              <div className="text-xs text-muted-foreground">avg chars</div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback for unknown tools or error states
  return (
    <div className="flex items-center gap-2 text-sm py-2 text-muted-foreground">
      <Icon className={cn("size-4", config.color)} />
      <span>{config.label} complete</span>
    </div>
  );
}

function Chat() {
  const { messages, sendMessage } = useChat();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onChange: messageSchema,
    },
    onSubmit: async ({ value }) => {
      sendMessage({ text: value.message });
      form.reset();
    },
  });

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Journal Chatbot</h1>
          <Button variant="ghost" size="sm" onClick={() => router.navigate({ to: "/logout" })}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Messages - scrollable, takes remaining space */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Welcome state
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="max-w-md space-y-3">
              <h2 className="text-2xl font-semibold">Welcome to Journal Chatbot</h2>
              <p className="text-muted-foreground">
                Start a conversation with your AI-powered journal assistant. Share your thoughts,
                reflect on your day, or explore ideas.
              </p>
            </div>
          </div>
        ) : (
          // Messages list
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {/* Message bubble */}
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 max-w-prose",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-foreground",
                  )}
                >
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <div key={i} className="whitespace-pre-wrap wrap-break-word">
                          {part.text}
                        </div>
                      );
                    }
                    if (part.type.startsWith("tool-")) {
                      return (
                        <ToolInvocationDisplay
                          key={i}
                          part={
                            part as UIToolInvocation<{ inputSchema: z.ZodType }> & { type: string }
                          }
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input - fixed at bottom */}
      <div className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field name="message">
              {(field) => (
                <input
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={field.state.value}
                  placeholder="Say something..."
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>
          </form>
        </div>
      </div>
    </div>
  );
}
