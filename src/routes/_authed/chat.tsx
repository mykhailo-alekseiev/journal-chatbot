import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { cn } from "~/lib/utils";
import { isToolUIPart } from "ai";
import { ToolInvocationDisplay } from "~/components/chat/ToolInvocationDisplay";
import { PromptPresets } from "~/components/chat/PromptPresets";
import { ChatInput } from "~/components/chat/ChatInput";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useCallback } from "react";
import { useChatSession, useCreateChatSession, useUpdateChatSession } from "~/features/chats/api";
import { parseMessages } from "~/features/chats/types";
import { generateChatTitleFn } from "~/features/chats/server";
import styles from "./chat.module.css";

export const Route = createFileRoute("/_authed/chat")({
  component: Chat,
});

function Chat() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chatId } = useSearch({ from: "/_authed" });
  const chatIdRef = useRef<string | undefined>(chatId);
  const prevChatIdRef = useRef<string | undefined>(chatId);

  // Load existing session
  const { data: existingSession } = useChatSession({
    id: chatId || "",
    queryConfig: { enabled: !!chatId },
  });

  const createSession = useCreateChatSession();
  const updateSession = useUpdateChatSession();

  const generateTitle = useCallback(
    async (msgs: typeof messages, sessionId: string) => {
      const userMsg = msgs.find((m) => m.role === "user");
      const assistantMsg = msgs.find((m) => m.role === "assistant");

      if (!userMsg || !assistantMsg) return;

      try {
        const userContent = userMsg.parts?.find((p) => p.type === "text")?.text || "";
        const assistantContent = assistantMsg.parts?.find((p) => p.type === "text")?.text || "";

        const { title } = await generateChatTitleFn({
          data: {
            userMessage: userContent,
            assistantMessage: assistantContent,
          },
        });

        if (title) {
          await updateSession.mutateAsync({ data: { id: sessionId, updates: { title } } });
        }
      } catch (error) {
        console.error("Failed to generate title:", error);
      }
    },
    [updateSession],
  );

  const saveMessages = useCallback(
    async (msgs: typeof messages) => {
      const currentChatId = chatIdRef.current;

      if (currentChatId) {
        // Update existing session
        await updateSession.mutateAsync({
          data: { id: currentChatId, updates: { messages: msgs } },
        });
      } else if (msgs.length >= 2) {
        // Create new session after first exchange (user + assistant)
        const session = await createSession.mutateAsync({ data: { messages: msgs } });
        chatIdRef.current = session.id;

        // Update URL without full navigation
        navigate({ to: "/chat", search: { chatId: session.id }, replace: true });

        // Generate title async
        generateTitle(msgs, session.id);
      }
    },
    [createSession, updateSession, navigate, generateTitle],
  );

  const { messages, sendMessage, setMessages } = useChat({
    onToolCall: ({ toolCall }) => {
      if (
        toolCall.toolName === "update_journal_entry" ||
        toolCall.toolName === "create_journal_entry"
      ) {
        queryClient.invalidateQueries({ queryKey: ["journal"] });
      }
    },
    onFinish: async ({ messages: newMessages }) => {
      // Save after AI response completes
      await saveMessages(newMessages);
    },
  });

  // Sync messages when session loads or clear when starting new chat
  useEffect(() => {
    if (existingSession) {
      setMessages(parseMessages(existingSession.messages));
    } else if (!chatId && prevChatIdRef.current) {
      // Clear messages when navigating from existing chat to new chat
      setMessages([]);
    }
    prevChatIdRef.current = chatId;
  }, [existingSession, chatId, setMessages]);

  // Update ref when chatId changes
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

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
                    message.role === "user" ? styles.userMessage : styles.assistantMessage,
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
