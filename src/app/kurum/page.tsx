import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function KurumHome() {
  const user = await requireRole("institution");

  const { data: inst } = await supabase
    .from("institutions")
    .select("name, city")
    .eq("id", user.institution_id!)
    .single();

  const [studentsRes, setsRes, ordersRes] = await Promise.all([
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("institution_id", user.institution_id!),
    supabase
      .from("sets")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", user.institution_id!),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", user.institution_id!),
  ]);

  const students = studentsRes.count ?? 0;
  const sets = setsRes.count ?? 0;
  const orders = ordersRes.count ?? 0;

  // Revenue SUM — fetch totals and sum in JS
  const { data: revenueRows } = await supabase
    .from("orders")
    .select("total")
    .eq("institution_id", user.institution_id!)
    .neq("status", "cancelled");
  const revenue = (revenueRows ?? []).reduce((s, r) => s + Number(r.total), 0);

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
