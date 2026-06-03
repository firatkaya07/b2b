import { requireRole } from "@/lib/auth";
import { one } from "@/lib/db";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function KurumHome() {
  const user = await requireRole("institution");
  const inst = await one<{ name: string; city: string }>(
    "SELECT name, city FROM institutions WHERE id = ?",
    [user.institution_id]
  );

  const students = Number(
    (
      await one<{ c: number }>(
        "SELECT COUNT(*) c FROM users WHERE role='student' AND institution_id = ?",
        [user.institution_id]
      )
    )?.c ?? 0
  );
  const sets = Number(
    (
      await one<{ c: number }>("SELECT COUNT(*) c FROM sets WHERE institution_id = ?", [
        user.institution_id,
      ])
    )?.c ?? 0
  );
  const orders = Number(
    (
      await one<{ c: number }>("SELECT COUNT(*) c FROM orders WHERE institution_id = ?", [
        user.institution_id,
      ])
    )?.c ?? 0
  );
  const revenue = Number(
    (
      await one<{ s: number }>(
        "SELECT COALESCE(SUM(total),0) s FROM orders WHERE institution_id = ? AND status != 'cancelled'",
        [user.institution_id]
      )
    )?.s ?? 0
  );

  return (
    <Shell role="institution" name={user.full_name}>
      <h1 className="text-xl font-semibold">{inst?.name}</h1>
      <p className="mb-5 text-sm text-slate-500">{inst?.city}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500">Öğrenci</p>
          <p className="text-2xl font-bold">{students}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Set</p>
          <p className="text-2xl font-bold">{sets}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Sipariş</p>
          <p className="text-2xl font-bold">{orders}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Ciro</p>
          <p className="text-2xl font-bold text-brand">{tl(revenue)}</p>
        </div>
      </div>
    </Shell>
  );
}
