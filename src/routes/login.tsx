import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "../components/login-form";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/chat" });
    }
  },
  component: LoginComp,
});

function LoginComp() {
  return <LoginForm />;
}
