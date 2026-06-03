import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./types";

const COOKIE = "session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-key-change-me-please-32chars"
);

export interface SessionPayload {
  uid: number;
  role: Role;
  name: string;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function destroySession() {
  cookies().delete(COOKIE);
}
