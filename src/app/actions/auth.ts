"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginState =
  | {
      error?: string;
      fields?: { email?: string };
    }
  | undefined;

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the submitted credentials.",
      fields: { email: String(formData.get("email") ?? "") },
    };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "Email or password is incorrect, or the account is inactive."
            : "Authentication is temporarily unavailable.",
        fields: { email: parsed.data.email },
      };
    }

    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
