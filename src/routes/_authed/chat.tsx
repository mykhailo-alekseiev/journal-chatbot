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
import styles from "./chat.module.css";

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
    <div className={styles.container}>
      {/* Messages */}
      <div className={styles.messagesScroll}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <h2 className={styles.emptyTitle}>Welcome to Journal Chatbot</h2>
              <p className={styles.emptyDescription}>
                Start a conversation with your AI-powered journal assistant. Share your thoughts,
                reflect on your day, or explore ideas.
              </p>
              <PromptPresets onSelect={(message) => sendMessage({ text: message })} />
            </div>
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    styles.messageBubble,
                    message.role === "user"
                      ? styles.userMessage
                      : styles.assistantMessage,
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
