import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { booksInSet } from "@/lib/queries";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";
import { createSet, approveSet, rejectSet } from "../actions";
import type { Book, SetRow } from "@/lib/types";

export default async function SetsPage() {
  const user = await requireRole("admin");

  const { data: setsRaw, error: setsErr } = await supabase
    .from("sets")
    .select("*, institutions(name)")
    .order("grade");
  if (setsErr) throw setsErr;

  const allSets = (setsRaw ?? []).map((s: any) => ({
    ...s,
    institution_name: s.institutions?.name ?? "",
  })) as (SetRow & { institution_name: string })[];

  const pendingSets = allSets.filter((s) => s.approval_status === "pending_approval");
  const approvedSets = allSets.filter((s) => s.approval_status === "approved");

  approvedSets.sort((a, b) =>
    `${a.institution_name}|${a.grade}`.localeCompare(`${b.institution_name}|${b.grade}`)
  );

  const approvedBooks = await Promise.all(approvedSets.map((s) => booksInSet(s.id)));
  const pendingBooks = await Promise.all(pendingSets.map((s) => booksInSet(s.id)));

  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name")
    .order("name");

  const { data: booksData } = await supabase
    .from("books")
    .select("*")
    .order("title");
  const books = (booksData ?? []) as Book[];

  return (
    <Shell role="admin" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Setler</h1>

      {/* İncelenecek setler */}
      {pendingSets.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
              {pendingSets.length}
            </span>
            İncelenecek set talepleri
          </h2>
          <div className="space-y-4">
            {pendingSets.map((s, idx) => (
              <div key={s.id} className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg">{s.name}</p>
                    <p className="text-sm text-slate-600">
                      {s.institution_name} · {s.grade}. sınıf
                      {s.section ? ` / ${s.section} şube` : " / tüm şubeler"}
                      {s.teacher ? ` · ${s.teacher}` : ""}
                    </p>
                    {s.description && (
                      <p className="mt-1 text-sm text-slate-500">{s.description}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Kitaplar: {pendingBooks[idx].length > 0
                        ? pendingBooks[idx].map((b) => b.title).join(", ")
                        : "Kitap eklenmemiş"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <form action={approveSet} className="flex items-end gap-2">
                    <input type="hidden" name="setId" value={s.id} />
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Set fiyatı belirle</label>
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        className="input w-32"
                        placeholder="₺ Fiyat"
                        required
                      />
                    </div>
                    <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition">
                      Onayla
                    </button>
                  </form>
                  <form action={rejectSet}>
                    <input type="hidden" name="setId" value={s.id} />
                    <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition">
                      Reddet
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-semibold text-slate-700">Onaylanmış setler</h2>
          {approvedSets.map((s, idx) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-slate-500">
                    {s.institution_name} · {s.grade}. sınıf
                    {s.section ? ` / ${s.section} şube` : " / tüm şubeler"}
                    {s.teacher ? ` · ${s.teacher}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {approvedBooks[idx].map((b) => b.title).join(", ")}
                  </p>
                </div>
                <span className="font-bold text-brand">{tl(s.price)}</span>
              </div>
            </div>
          ))}
          {approvedSets.length === 0 && (
            <p className="text-sm text-slate-400">Henüz onaylanmış set yok.</p>
          )}
        </div>

        <form action={createSet} className="card space-y-3 h-fit">
          <h2 className="font-semibold">Yeni set (admin)</h2>
          <select name="institution_id" className="input" required>
            <option value="">Kurum seçin</option>
            {(institutions ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <input name="name" className="input" placeholder="Set adı" required />
          <div className="grid grid-cols-2 gap-2">
            <input name="grade" className="input" placeholder="Sınıf (örn 9)" required />
            <input name="section" className="input" placeholder="Şube (boş=tümü)" />
          </div>
          <input name="teacher" className="input" placeholder="Öğretmen (opsiyonel)" />
          <input name="price" type="number" step="0.01" className="input" placeholder="Set fiyatı" />
          <textarea name="description" className="input" rows={2} placeholder="Açıklama" />
          <div>
            <p className="label">Set içindeki kitaplar</p>
            <div className="max-h-40 space-y-1 overflow-auto rounded-md border border-slate-200 p-2">
              {books.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="book_ids" value={b.id} />
                  {b.title}
                </label>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full">Set oluştur</button>
        </form>
      </div>
    </Shell>
  );
}
