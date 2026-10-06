// Next.js 16 route guard (the replacement for middleware.ts).
// This is only the FIRST gate. Every page/action still re-checks the user
// server-side (requireUser + lib/access.server.ts) — that is the real security.
import { auth } from "@/auth";

// Auth.js's `auth` export doubles as middleware/proxy.
export const proxy = auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/members/:path*",
    "/activity/:path*",
    "/profile/:path*",
  ],
};
