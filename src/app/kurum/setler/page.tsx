import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function KurumSets() {
  const user = await requireRole("institution");

  const { data: sets, error } = await supabase
    .from("sets")
    .select("*")
    .eq("institution_id", user.institution_id!)
    .order("grade")
    .order("name");
  if (error) throw error;

  // Get book counts per set
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

  return (
    <Shell role="institution" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Kitap setleri</h1>

      {(sets ?? []).length === 0 ? (
        <div className="card text-center text-slate-500">
          <p>Kurumunuza tanımlı set bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(sets ?? []).map((s: any) => (
            <Link
              key={s.id}
              href={`/kurum/setler/${s.id}`}
              className="card hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold group-hover:text-brand transition">{s.name}</h2>
                <span className={`badge ${s.is_active === 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {s.is_active === 1 ? "Aktif" : "Pasif"}
                </span>
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
                <span className="font-bold text-brand">{tl(s.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
