import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@/generated/prisma/enums";
import { getDb } from "@/lib/db";
import { getAuthEnvironment } from "@/lib/env";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: getAuthEnvironment().AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await getDb().user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            departmentId: true,
            active: true,
          },
        });

        if (!user?.active || !user.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.userId);
      session.user.role = token.role as UserRole;
      session.user.departmentId =
        typeof token.departmentId === "string" ? token.departmentId : null;
      return session;
    },
  },
});
