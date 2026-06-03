import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function AdminHome() {
  const user = await requireRole("admin");

  const [institutions, students, sets, books, orders] = await Promise.all([
    supabase.from("institutions").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("sets").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  // For revenue SUM, fetch totals and sum in JS
  const { data: revenueRows } = await supabase
    .from("orders")
    .select("total")
    .neq("status", "cancelled");
  const revenue = (revenueRows ?? []).reduce((s, r) => s + Number(r.total), 0);

  const stats = [
    { label: "Kurumlar", value: institutions.count ?? 0 },
    { label: "Öğrenciler", value: students.count ?? 0 },
    { label: "Setler", value: sets.count ?? 0 },
    { label: "Kitaplar", value: books.count ?? 0 },
    { label: "Siparişler", value: orders.count ?? 0 },
  ];

  return (
    <Shell role="admin" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Genel bakış</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
        <div className="card col-span-2 sm:col-span-1">
          <p className="text-sm text-slate-500">Ciro</p>
          <p className="text-2xl font-bold text-brand">{tl(revenue)}</p>
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Soldaki menüden kurumları, kitapları, setleri ve öğrencileri yönetebilirsiniz.
      </p>
    </Shell>
  );
}
