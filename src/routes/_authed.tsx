import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LoginForm } from "../components/LoginForm";
import { getSupabaseServerClient } from "../utils/supabase";
import { AppLayout } from "../components/layout/AppLayout";

const searchParamsSchema = z.object({
  chatId: z.string().uuid().optional(),
});

const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(loginInputSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  });

export const Route = createFileRoute("/_authed")({
  validateSearch: searchParamsSchema,
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw new Error("Not authenticated");
    }
  },
  component: AppLayout,
  errorComponent: ({ error }) => {
    if (error.message === "Not authenticated") {
      return <LoginForm />;
    }

    throw error;
  },
});
