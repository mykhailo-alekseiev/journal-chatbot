import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../components/login-form";

export const Route = createFileRoute("/login")({
  component: LoginComp,
});

function LoginComp() {
  return <LoginForm />;
}
