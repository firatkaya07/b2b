import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl, statusLabel } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function AdminOrders() {
  const user = await requireRole("admin");

  // Fetch orders with user and institution via foreign key relationships
  const { data: ordersRaw, error } = await supabase
    .from("orders")
    .select("*, users(full_name), institutions(name)")
    .order("id", { ascending: false });
  if (error) throw error;

  // For each order, get the latest shipment tracking_no
  const orderIds = (ordersRaw ?? []).map((o: any) => o.id);
  let shipmentsMap: Record<number, string> = {};
  if (orderIds.length > 0) {
    const { data: shipments } = await supabase
      .from("shipments")
      .select("order_id, tracking_no")
      .in("order_id", orderIds)
      .order("id", { ascending: false });
    // Keep only the latest per order_id
    for (const s of shipments ?? []) {
      if (!shipmentsMap[s.order_id]) {
        shipmentsMap[s.order_id] = s.tracking_no;
      }
    }
  }

  const orders = (ordersRaw ?? []).map((o: any) => ({
    ...o,
    student_name: o.users?.full_name ?? "",
    institution_name: o.institutions?.name ?? "",
    tracking: shipmentsMap[o.id] || null,
  }));

  return (
    <Shell role="admin" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Tüm siparişler</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Öğrenci</th>
              <th className="px-3 py-2">Kurum</th>
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
                  <td className="px-3 py-2 text-slate-500">{o.institution_name}</td>
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
