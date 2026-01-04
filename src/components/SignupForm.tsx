import { Link, useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { signupFn } from "~/routes/signup";

const signupSchema = z
  .object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export function SignupForm() {
  const router = useRouter();

  const signupMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string; password: string }) => {
      const result = await signupFn({ data });
      if (result?.error) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      router.invalidate();
    },
  });

  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onBlur: signupSchema,
    },
    onSubmit: async ({ value }) => {
      await signupMutation.mutateAsync({
        fullName: value.fullName,
        email: value.email,
        password: value.password,
      });
    },
  });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Enter your information below to create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <FieldGroup>
                <form.Field name="fullName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        required
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-500 mt-1">
                          {error?.message}
                        </p>
                      ))}
                    </Field>
                  )}
                </form.Field>
                <form.Field name="email">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldDescription>
                        We&apos;ll use this to contact you. We will not share your email with anyone
                        else.
                      </FieldDescription>
                      {field.state.meta.errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-500 mt-1">
                          {error?.message}
                        </p>
                      ))}
                    </Field>
                  )}
                </form.Field>
                <form.Field name="password">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldDescription>Must be at least 8 characters long.</FieldDescription>
                      {field.state.meta.errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-500 mt-1">
                          {error?.message}
                        </p>
                      ))}
                    </Field>
                  )}
                </form.Field>
                <form.Field name="confirmPassword">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        required
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldDescription>Please confirm your password.</FieldDescription>
                      {field.state.meta.errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-500 mt-1">
                          {error?.message}
                        </p>
                      ))}
                    </Field>
                  )}
                </form.Field>
                <Field>
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!canSubmit || isSubmitting}
                      >
                        {isSubmitting ? "Creating account..." : "Create Account"}
                      </Button>
                    )}
                  </form.Subscribe>
                  {signupMutation.error && (
                    <p className="text-sm text-red-500 mt-2 text-center">
                      {signupMutation.error.message}
                    </p>
                  )}
                  <p className="text-sm text-center mt-4">
                    Already have an account?{" "}
                    <Link to="/login" className="underline">
                      Sign in
                    </Link>
                  </p>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
