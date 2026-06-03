import { redirect } from "next/navigation";
import { one } from "./db";
import { getSession } from "./session";
import type { Role, User } from "./types";

export async function currentUser(): Promise<User | null> {
  const s = await getSession();
  if (!s) return null;
  const u = await one<User>("SELECT * FROM users WHERE id = ? AND is_active = 1", [s.uid]);
  return u ?? null;
}

// Sayfa koruması: oturum yoksa /login'e, rol uyuşmazsa kendi paneline yönlendirir.
export async function requireRole(role: Role): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== role) redirect(homeFor(u.role));
  return u;
}

export function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "institution") return "/kurum";
  return "/ogrenci";
}
