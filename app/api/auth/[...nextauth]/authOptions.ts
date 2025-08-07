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

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    // Tempo máximo de inatividade (30 minutos)
    maxAge: 30 * 60, // 30 minutos em segundos
    // Atualiza a sessão a cada 5 minutos
    updateAge: 5 * 60, // 5 minutos em segundos
  },
  jwt: {
    // Tempo de vida do JWT (30 minutos)
    maxAge: 30 * 60, // 30 minutos em segundos
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.acccessToken = user.token || "";
        token.role = user.role || "user"; // Default to 'user' if no role is provided
      }
      // if (user?.token) token.accessToken = user.token;
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken as string;
      session.user.role = token.role as string; // Ensure role is set in session
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
