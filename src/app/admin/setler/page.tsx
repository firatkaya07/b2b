import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { booksInSet } from "@/lib/queries";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";
import { createSet } from "../actions";
import type { Book, SetRow } from "@/lib/types";

export default async function SetsPage() {
  const user = await requireRole("admin");

  // Fetch sets with institution name via foreign key
  const { data: setsRaw, error: setsErr } = await supabase
    .from("sets")
    .select("*, institutions(name)")
    .order("grade");
  if (setsErr) throw setsErr;

  const sets = (setsRaw ?? []).map((s: any) => ({
    ...s,
    institution_name: s.institutions?.name ?? "",
  })) as (SetRow & { institution_name: string })[];
  // Sort by institution name then grade
  sets.sort((a, b) =>
    `${a.institution_name}|${a.grade}`.localeCompare(`${b.institution_name}|${b.grade}`)
  );

  const setBooks = await Promise.all(sets.map((s) => booksInSet(s.id)));

  const { data: institutions, error: instErr } = await supabase
    .from("institutions")
    .select("id, name")
    .order("name");
  if (instErr) throw instErr;

  const { data: booksData, error: booksErr } = await supabase
    .from("books")
    .select("*")
    .order("title");
  if (booksErr) throw booksErr;
  const books = booksData as Book[];

  return (
    <Shell role="admin" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Setler</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {sets.map((s, idx) => (
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
                    {setBooks[idx].map((b) => b.title).join(", ")}
                  </p>
                </div>
                <span className="font-bold text-brand">{tl(s.price)}</span>
              </div>
            </div>
          ))}
        </div>

        <form action={createSet} className="card space-y-3">
          <h2 className="font-semibold">Yeni set</h2>
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
