import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/api/me", "/api/secure", "/app", "/admin"]; // adjust as needed

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!protectedPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  // Require cookie or Authorization header to reach handlers
  const hasCookie = req.cookies.has("session");
  const hasBearer = req.headers.get("authorization")?.startsWith("Bearer ");
  if (!hasCookie && !hasBearer) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  return NextResponse.next();
}

