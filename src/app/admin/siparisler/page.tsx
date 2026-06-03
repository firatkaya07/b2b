import { requireRole } from "@/lib/auth";
import { q } from "@/lib/db";
import { tl, statusLabel } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function AdminOrders() {
  const user = await requireRole("admin");
  const orders = await q<any>(
    `SELECT o.*, u.full_name AS student_name, i.name AS institution_name,
      (SELECT tracking_no FROM shipments sh WHERE sh.order_id=o.id ORDER BY sh.id DESC LIMIT 1) AS tracking
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN institutions i ON i.id = o.institution_id
     ORDER BY o.id DESC`
  );

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
            {orders.map((o) => {
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
