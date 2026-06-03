import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";
import { createSetRequest } from "../actions";
import type { Book } from "@/lib/types";

function approvalBadge(status: string) {
  switch (status) {
    case "approved":
      return { text: "Onaylandı", cls: "bg-emerald-100 text-emerald-700" };
    case "pending_approval":
      return { text: "Onay bekliyor", cls: "bg-amber-100 text-amber-700" };
    case "rejected":
      return { text: "Reddedildi", cls: "bg-red-100 text-red-700" };
    default:
      return { text: status, cls: "bg-slate-100 text-slate-600" };
  }
}

export default async function KurumSets() {
  const user = await requireRole("institution");

  const { data: sets, error } = await supabase
    .from("sets")
    .select("*")
    .eq("institution_id", user.institution_id!)
    .order("grade")
    .order("name");
  if (error) throw error;

  const setIds = (sets ?? []).map((s: any) => s.id);
  let bookCountMap: Record<number, number> = {};
  if (setIds.length > 0) {
    const { data: sb } = await supabase
      .from("set_books")
      .select("set_id")
      .in("set_id", setIds);
    for (const row of sb ?? []) {
      bookCountMap[row.set_id] = (bookCountMap[row.set_id] || 0) + 1;
    }
  }

  const { data: booksData } = await supabase
    .from("books")
    .select("*")
    .order("title");
  const books = (booksData ?? []) as Book[];

  return (
    <Shell role="institution" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Kitap setleri</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {(sets ?? []).length === 0 ? (
            <div className="card text-center text-slate-500">
              <p>Kurumunuza tanımlı set bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(sets ?? []).map((s: any) => {
                const badge = approvalBadge(s.approval_status);
                return (
                  <Link
                    key={s.id}
                    href={`/kurum/setler/${s.id}`}
                    className="card hover:shadow-md transition group"
                  >
                    <div className="flex items-start justify-between">
                      <h2 className="font-semibold group-hover:text-brand transition">{s.name}</h2>
                      <span className={`badge ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="badge bg-brand-light text-brand-dark">{s.grade}. sınıf</span>
                      {s.section && <span className="badge bg-slate-100 text-slate-600">{s.section} şubesi</span>}
                      {s.teacher && <span className="badge bg-slate-100 text-slate-600">{s.teacher}</span>}
                    </div>
                    {s.description && (
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">{s.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-400">{bookCountMap[s.id] || 0} kitap</span>
                      {s.approval_status === "approved" && (
                        <span className="font-bold text-brand">{tl(s.price)}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <form action={createSetRequest} className="card space-y-3 h-fit">
          <h2 className="font-semibold">Yeni set talebi</h2>
          <p className="text-xs text-slate-500">Set, yönetici onayından sonra öğrencilere görünür olur.</p>
          <input name="name" className="input" placeholder="Set adı" required />
          <div className="grid grid-cols-2 gap-2">
            <input name="grade" className="input" placeholder="Sınıf (örn 9)" required />
            <input name="section" className="input" placeholder="Şube (boş=tümü)" />
          </div>
          <input name="teacher" className="input" placeholder="Öğretmen (opsiyonel)" />
          <textarea name="description" className="input" rows={2} placeholder="Açıklama" />
          <div>
            <p className="label">Set içindeki kitaplar</p>
            <div className="max-h-48 space-y-1 overflow-auto rounded-md border border-slate-200 p-2">
              {books.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="book_ids" value={b.id} />
                  <span className="truncate">{b.title}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full">Set talebi gönder</button>
        </form>
      </div>
    </Shell>
  );
}
