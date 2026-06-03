import Link from "next/link";
import { logout } from "@/app/actions";
import type { Role } from "@/lib/types";

const NAV: Record<Role, { href: string; label: string }[]> = {
  student: [
    { href: "/ogrenci", label: "Setlerim" },
    { href: "/ogrenci/sepet", label: "Sepet" },
    { href: "/ogrenci/siparisler", label: "Siparişlerim" },
  ],
  admin: [
    { href: "/admin", label: "Özet" },
    { href: "/admin/kurumlar", label: "Kurumlar" },
    { href: "/admin/kitaplar", label: "Kitaplar" },
    { href: "/admin/setler", label: "Setler" },
    { href: "/admin/ogrenciler", label: "Öğrenciler" },
    { href: "/admin/siparisler", label: "Siparişler" },
  ],
  institution: [
    { href: "/kurum", label: "Özet" },
    { href: "/kurum/setler", label: "Setler" },
    { href: "/kurum/ogrenciler", label: "Öğrenciler" },
    { href: "/kurum/siparisler", label: "Siparişler" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  student: "Öğrenci",
  admin: "Yönetici",
  institution: "Kurum Yetkilisi",
};

export default function Shell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-brand">Kitap Seti</span>
            <nav className="flex flex-wrap gap-1">
              {NAV[role].map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm sm:block">
              <span className="block font-medium">{name}</span>
              <span className="block text-xs text-slate-400">{ROLE_LABEL[role]}</span>
            </span>
            <form action={logout}>
              <button className="btn-ghost text-sm">Çıkış</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
