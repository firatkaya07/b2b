import { requireRole } from "@/lib/auth";
import { q } from "@/lib/db";
import { ordersForUser, orderItems } from "@/lib/queries";
import { tl, statusLabel } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { yeni?: string };
}) {
  const user = await requireRole("student");
  const orders = await ordersForUser(user.id);
  const newId = searchParams.yeni ? Number(searchParams.yeni) : null;

  const data = await Promise.all(
    orders.map(async (o) => ({
      order: o,
      items: await orderItems(o.id),
      ship: (
        await q<{ carrier: string; tracking_no: string }>(
          "SELECT carrier, tracking_no FROM shipments WHERE order_id = ? ORDER BY id DESC LIMIT 1",
          [o.id]
        )
      )[0],
    }))
  );

  return (
    <Shell role="student" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Siparişlerim</h1>

      {newId && (
        <div className="mb-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Siparişiniz alındı! Sipariş no: #{newId}
        </div>
      )}

      {data.length === 0 ? (
        <div className="card text-sm text-slate-500">Henüz siparişiniz yok.</div>
      ) : (
        <div className="space-y-4">
          {data.map(({ order: o, items, ship }) => {
            const st = statusLabel(o.status);
            return (
              <div key={o.id} className="card">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Sipariş #{o.id}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {new Date(o.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <span className={`badge ${st.cls}`}>{st.text}</span>
                </div>
                <ul className="space-y-1 text-sm">
                  {items.map((it) => (
                    <li key={it.id} className="flex justify-between">
                      <span className="text-slate-600">
                        {it.set_name} × {it.quantity}
                      </span>
                      <span>{tl(Number(it.price) * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-500">
                    {ship?.tracking_no
                      ? `${ship.carrier} · Takip: ${ship.tracking_no}`
                      : "Kargo hazırlanıyor"}
                  </span>
                  <span className="font-semibold text-brand">{tl(o.total)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Teslimat: {o.recipient_name}, {o.address}, {o.district}/{o.city}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
