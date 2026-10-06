import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyCredentials, getUserById } from "@/lib/auth.service";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma), // stores OAuth (Google) links
  session: { strategy: "jwt", maxAge: THIRTY_DAYS }, // cookie, not DB table

  // OAuth errors (e.g. OAuthAccountNotLinked) redirect here with ?error=
  pages: { error: "/login" },

  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        // All checking lives in the service — this stays short.
        return verifyCredentials(
          String(creds?.email ?? ""),
          String(creds?.password ?? "")
        );
      },
    }),

    // Google turns on only when its keys exist in .env.
    // Email/Google auto-merge is intentionally OFF (security):
    // a signed-out Google sign-in with an existing email gives
    // OAuthAccountNotLinked instead of silently merging accounts.
    ...(process.env.AUTH_GOOGLE_ID ? [Google({})] : []),
  ],

  callbacks: {
    // Put the user id inside the session cookie.
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },

    // Refresh name/email/image from DB on each read.
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        try {
          const fresh = await getUserById(token.sub);
          if (fresh) {
            session.user.name = fresh.name ?? session.user.name;
            session.user.email = fresh.email ?? session.user.email;
            session.user.image = fresh.image ?? session.user.image ?? null;
          }
        } catch {
          // DB unavailable — keep the token's values.
        }
      }
      return session;
    },
  },
});
