import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { cn } from "~/lib/utils";
import { isToolUIPart } from "ai";
import { ToolInvocationDisplay } from "~/components/chat/ToolInvocationDisplay";
import { PromptPresets } from "~/components/chat/PromptPresets";
import { ChatInput } from "~/components/chat/ChatInput";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback, lazy, Suspense, memo } from "react";

const ReactMarkdown = lazy(() => import("react-markdown"));
import { useChatSession, useCreateChatSession, useUpdateChatSession } from "~/features/chats/api";
import { parseMessages } from "~/features/chats/types";
import { generateChatTitleFn } from "~/features/chats/server";
import styles from "./chat.module.css";
import type { JournalAgentUIMessage } from "~/features/journal";

// Memoized message component to prevent re-renders
const MessageItem = memo(({ message }: { message: JournalAgentUIMessage }) => {
  return (
    <div>
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
                <Suspense fallback={<span>{part.text}</span>}>
                  <ReactMarkdown>{part.text}</ReactMarkdown>
                </Suspense>
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
  );
});

// Static empty state content (hoisted to avoid recreation)
const EmptyStateContent = (
  <>
    <h2 className={styles.emptyTitle}>Welcome to Journal Chatbot</h2>
    <p className={styles.emptyDescription}>
      Start a conversation with your AI-powered journal assistant. Share your thoughts, reflect on
      your day, or explore ideas.
    </p>
  </>
);

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

  const { messages, sendMessage, setMessages } = useChat<JournalAgentUIMessage>({
    onToolCall: ({ toolCall }) => {
      // Invalidate journal queries when entries are saved
      if (toolCall.toolName === "save_entry") {
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
      setMessages(parseMessages(existingSession.messages) as JournalAgentUIMessage[]);
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
  }, [messages.length]);

  return (
    <div className={styles.container}>
      {/* Messages */}
      <div className={styles.messagesScroll}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              {EmptyStateContent}
              <PromptPresets onSelect={(message) => sendMessage({ text: message })} />
            </div>
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
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
