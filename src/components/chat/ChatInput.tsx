import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

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
              <div className="flex gap-2 items-end">
                <Textarea
                  className="min-h-10 max-h-32 resize-none flex-1"
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
                    className="h-10 w-10 shrink-0"
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
