import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { User as NextAuthUser } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }
}

interface User extends NextAuthUser {
  token?: string;
  role?: string;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "jsmith@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log("Credentials:", credentials);
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        console.log("User found:", user);

        if (!user || !user.password) return null;

        // First, try plain text comparison
        if (credentials.password === user.password) {
          return { id: user.id, email: user.email };
        }

        // If plain text fails, try bcrypt comparison
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user?.token) token.accessToken = user.token;
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
