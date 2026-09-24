import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // required for password login
  pages: {
    // OAuth errors (e.g. OAuthAccountNotLinked) redirect here with ?error=
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(String(creds?.password ?? ""), user.passwordHash);
        return ok ? user : null;
      },
    }),
    // Google activates automatically only when its keys exist in .env.
    // NOTE: allowDangerousEmailAccountLinking is intentionally NOT enabled.
    // When a signed-out user tries Google with an email that already belongs to
    // an email/password account, Auth.js throws OAuthAccountNotLinked instead of
    // silently linking/merging. Explicit linking is handled separately: a
    // signed-in user can link Google from account settings (the `user` branch
    // in Auth.js handleLoginOrRegister), which we surface on the profile page.
    ...(process.env.AUTH_GOOGLE_ID
      ? [Google({})]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { name: true, email: true, image: true },
          });
          if (dbUser) {
            session.user.name = dbUser.name ?? session.user.name;
            session.user.email = dbUser.email ?? session.user.email;
            session.user.image = dbUser.image ?? session.user.image ?? null;
          }
        } catch {
          // DB unavailable on this request - keep values from the token.
        }
      }
      return session;
    },
  },
});
