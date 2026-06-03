import { requireRole } from "@/lib/auth";
import { one } from "@/lib/db";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";

async function count(sql: string): Promise<number> {
  const r = await one<{ c: number }>(sql);
  return Number(r?.c ?? 0);
}

export default async function AdminHome() {
  const user = await requireRole("admin");
  const stats = [
    { label: "Kurumlar", value: await count("SELECT COUNT(*) c FROM institutions") },
    { label: "Öğrenciler", value: await count("SELECT COUNT(*) c FROM users WHERE role='student'") },
    { label: "Setler", value: await count("SELECT COUNT(*) c FROM sets") },
    { label: "Kitaplar", value: await count("SELECT COUNT(*) c FROM books") },
    { label: "Siparişler", value: await count("SELECT COUNT(*) c FROM orders") },
  ];
  const rev = await one<{ s: number }>(
    "SELECT COALESCE(SUM(total),0) s FROM orders WHERE status != 'cancelled'"
  );
  const revenue = Number(rev?.s ?? 0);

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
