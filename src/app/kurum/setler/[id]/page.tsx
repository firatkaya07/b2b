import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function KurumSetDetail({ params }: { params: { id: string } }) {
  const user = await requireRole("institution");
  const setId = Number(params.id);

  const { data: set, error } = await supabase
    .from("sets")
    .select("*")
    .eq("id", setId)
    .eq("institution_id", user.institution_id!)
    .single();
  if (error || !set) notFound();

  const { data: setBooks } = await supabase
    .from("set_books")
    .select("quantity, books(*)")
    .eq("set_id", setId);

  const books = (setBooks ?? []).map((row: any) => ({
    ...row.books,
    quantity: row.quantity,
  }));

  return (
    <Shell role="institution" name={user.full_name}>
      <Link href="/kurum/setler" className="text-sm text-brand hover:underline">
        ← Setlere dön
      </Link>

      <div className="mt-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{set.name}</h1>
          <span className={`badge ${set.is_active === 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {set.is_active === 1 ? "Aktif" : "Pasif"}
          </span>
        </div>
        {set.description && <p className="mt-1 text-slate-500">{set.description}</p>}
        <div className="mt-2 flex gap-2 text-xs">
          <span className="badge bg-brand-light text-brand-dark">{set.grade}. sınıf</span>
          {set.section && <span className="badge bg-slate-100 text-slate-600">{set.section} şubesi</span>}
          {set.teacher && <span className="badge bg-slate-100 text-slate-600">{set.teacher}</span>}
        </div>
        <p className="mt-3 text-2xl font-bold text-brand">{tl(set.price)}</p>
      </div>

      <h2 className="mb-3 mt-6 font-semibold">Set içindeki kitaplar ({books.length})</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {books.map((b: any) => (
          <div
            key={b.id}
            className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            {b.image_url ? (
              <img
                src={b.image_url}
                alt={b.title}
                className="h-28 w-20 flex-shrink-0 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-28 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold leading-tight">{b.title}</h3>
                {b.author && <p className="mt-1 text-xs text-slate-500">{b.author}</p>}
                {b.publisher && <p className="mt-0.5 text-xs text-slate-400">{b.publisher}</p>}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-brand">{tl(b.price)}</span>
                {b.quantity > 1 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {b.quantity} adet
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
