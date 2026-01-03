import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({
        to: "/chat",
      });
    }

    throw redirect({
      to: "/login",
    });
  },
});
