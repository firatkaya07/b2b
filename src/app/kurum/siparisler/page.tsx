import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl, statusLabel } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function KurumOrders() {
  const user = await requireRole("institution");

  // Fetch orders with user name via foreign key
  const { data: ordersRaw, error } = await supabase
    .from("orders")
    .select("*, users(full_name)")
    .eq("institution_id", user.institution_id!)
    .order("id", { ascending: false });
  if (error) throw error;

  // Get tracking numbers for these orders
  const orderIds = (ordersRaw ?? []).map((o: any) => o.id);
  let shipmentsMap: Record<number, string> = {};
  if (orderIds.length > 0) {
    const { data: shipments } = await supabase
      .from("shipments")
      .select("order_id, tracking_no")
      .in("order_id", orderIds)
      .order("id", { ascending: false });
    for (const s of shipments ?? []) {
      if (!shipmentsMap[s.order_id]) {
        shipmentsMap[s.order_id] = s.tracking_no;
      }
    }
  }

  const orders = (ordersRaw ?? []).map((o: any) => ({
    ...o,
    student_name: o.users?.full_name ?? "",
    tracking: shipmentsMap[o.id] || null,
  }));

  return (
    <Shell role="institution" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Siparişler</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Öğrenci</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">Takip No</th>
              <th className="px-3 py-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => {
              const st = statusLabel(o.status);
              return (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{o.id}</td>
                  <td className="px-3 py-2 font-medium">{o.student_name}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${st.cls}`}>{st.text}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{o.tracking || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold">{tl(o.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
