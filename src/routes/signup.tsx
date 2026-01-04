import { redirect, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { SignupForm } from "../components/SignupForm";
import { getSupabaseServerClient } from "../utils/supabase";

export const signupFn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { email: string; password: string; fullName: string; redirectUrl?: string }) => d,
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });
    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }

    // Redirect to the prev page stored in the "redirect" search param
    throw redirect({
      href: data.redirectUrl || "/",
    });
  });

export const Route = createFileRoute("/signup")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/chat" });
    }
  },
  component: SignupComp,
});

function SignupComp() {
  return <SignupForm />;
}
