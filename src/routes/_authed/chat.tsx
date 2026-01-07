import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useChat } from "@ai-sdk/react";
import { z } from "zod";
import { cn } from "~/lib/utils";
import { isToolUIPart } from "ai";
import { ToolInvocationDisplay } from "~/components/chat/ToolInvocationDisplay";
import { PromptPresets } from "~/components/chat/PromptPresets";
import { Textarea } from "~/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authed/chat")({
  component: Chat,
});

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

function Chat() {
  const queryClient = useQueryClient();
  const { messages, sendMessage } = useChat({
    onToolCall: ({ toolCall }) => {
      if (
        toolCall.toolName === "update_journal_entry" ||
        toolCall.toolName === "create_journal_entry"
      ) {
        queryClient.invalidateQueries({ queryKey: ["journal"] });
      }
    },
  });

  const form = useForm({
    defaultValues: { message: "" },
    validators: { onChange: messageSchema },
    onSubmit: async ({ value }) => {
      sendMessage({ text: value.message });
      form.reset();
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="max-w-md space-y-3">
              <h2 className="text-2xl font-semibold">Welcome to Journal Chatbot</h2>
              <p className="text-muted-foreground">
                Start a conversation with your AI-powered journal assistant. Share your thoughts,
                reflect on your day, or explore ideas.
              </p>
              <PromptPresets onSelect={(message) => sendMessage({ text: message })} />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
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
                        <div key={i} className="markdown">
                          <ReactMarkdown>{part.text}</ReactMarkdown>
                        </div>
                      );
                    }
                    if (isToolUIPart(part)) {
                      return <ToolInvocationDisplay key={i} part={part} />;
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
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
                <Textarea
                  className="min-h-10 max-h-32 resize-none"
                  value={field.state.value}
                  placeholder="Say something... (Enter to send, Shift+Enter for new line)"
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit();
                    }
                  }}
                />
              )}
            </form.Field>
          </form>
        </div>
      </div>
    </div>
  );
}
