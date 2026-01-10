import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Send } from "lucide-react";
import { useIsMobile } from "~/hooks/use-mobile";
import styles from "./ChatInput.module.css";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const isMobile = useIsMobile();

  const form = useForm({
    defaultValues: { message: "" },
    validators: { onChange: messageSchema },
    onSubmit: async ({ value }) => {
      onSend(value.message);
      form.reset();
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="message">
            {(field) => (
              <div className={styles.inputRow}>
                <Textarea
                  className={styles.textarea}
                  value={field.state.value}
                  placeholder={
                    isMobile
                      ? "Say something..."
                      : "Say something... (Enter to send, Shift+Enter for new line)"
                  }
                  onChange={(e) => field.handleChange(e.currentTarget.value)}
                  onBlur={field.handleBlur}
                  onKeyDown={(e) => {
                    if (!isMobile && e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit();
                    }
                  }}
                />
                {isMobile && (
                  <Button
                    type="submit"
                    size="icon"
                    className={styles.sendButton}
                    disabled={!field.state.value.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </form.Field>
        </form>
      </div>
    </div>
  );
}
