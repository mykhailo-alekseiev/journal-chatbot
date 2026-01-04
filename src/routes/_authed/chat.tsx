import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useChat } from "@ai-sdk/react";
import { z } from "zod";

export const Route = createFileRoute("/_authed/chat")({
  component: Chat,
});

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

function Chat() {
  const { messages, sendMessage } = useChat();

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
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
              case "tool-convertFahrenheitToCelsius":
              case "tool-weather":
                return <pre key={`${message.id}-${i}`}>{JSON.stringify(part, null, 2)}</pre>;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="message"
          children={(field) => (
            <input
              className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
              value={field.state.value}
              placeholder="Say something..."
              onChange={(e) => field.handleChange(e.currentTarget.value)}
              onBlur={field.handleBlur}
            />
          )}
        />
      </form>
    </div>
  );
}
