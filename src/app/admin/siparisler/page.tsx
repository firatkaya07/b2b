import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl, statusLabel } from "@/lib/format";
import Shell from "@/components/Shell";
import { updateOrderStatus } from "../actions";

export default async function AdminOrders() {
  const user = await requireRole("admin");

  const { data: ordersRaw, error } = await supabase
    .from("orders")
    .select("*, users(full_name), institutions(name)")
    .order("id", { ascending: false });
  if (error) throw error;

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
    institution_name: o.institutions?.name ?? "",
    tracking: shipmentsMap[o.id] || null,
  }));

  function nextStatus(current: string): { status: string; label: string } | null {
    switch (current) {
      case "waiting_approval":
        return { status: "preparing", label: "Hazırlanıyor" };
      case "preparing":
        return { status: "shipped", label: "Kargoya verildi" };
      default:
        return null;
    }
  }

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
              <th className="px-3 py-2 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => {
              const st = statusLabel(o.status);
              const next = nextStatus(o.status);
              return (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Link href={`/admin/siparisler/${o.id}`} className="text-brand font-medium hover:underline">
                      #{o.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-medium">{o.student_name}</td>
                  <td className="px-3 py-2 text-slate-500">{o.institution_name}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${st.cls}`}>{st.text}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{o.tracking || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold">{tl(o.total)}</td>
                  <td className="px-3 py-2 text-center">
                    {next ? (
                      <form action={updateOrderStatus} className="inline-flex gap-1">
                        <input type="hidden" name="orderId" value={o.id} />
                        <input type="hidden" name="status" value={next.status} />
                        <button className="rounded-lg bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-dark transition">
                          {next.label}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
