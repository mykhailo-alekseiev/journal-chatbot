import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { cn } from "~/lib/utils";
import { isToolUIPart } from "ai";
import { ToolInvocationDisplay } from "~/components/chat/ToolInvocationDisplay";
import { PromptPresets } from "~/components/chat/PromptPresets";
import { ChatInput } from "~/components/chat/ChatInput";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/_authed/chat")({
  component: Chat,
});

function Chat() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="grid grid-rows-[1fr_auto] h-full overflow-hidden">
      {/* Messages */}
      <div className="overflow-y-auto">
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={(message) => sendMessage({ text: message })} />
    </div>
  );
}
