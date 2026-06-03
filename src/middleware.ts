import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-key-change-me-please-32chars"
);

// Korumalı alanlar ve izin verilen roller. Giriş yapmadan setler görüntülenemez.
const RULES: { prefix: string; role: string; home: string }[] = [
  { prefix: "/admin", role: "admin", home: "/admin" },
  { prefix: "/kurum", role: "institution", home: "/kurum" },
  { prefix: "/ogrenci", role: "student", home: "/ogrenci" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    if (role !== rule.role) {
      const home =
        role === "admin" ? "/admin" : role === "institution" ? "/kurum" : "/ogrenci";
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/kurum/:path*", "/ogrenci/:path*"],
};
