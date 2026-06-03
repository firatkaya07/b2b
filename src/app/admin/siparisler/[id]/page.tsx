import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { tl, statusLabel } from "@/lib/format";
import Shell from "@/components/Shell";
import { updateOrderStatus } from "../../actions";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const user = await requireRole("admin");
  const orderId = Number(params.id);

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, users(full_name, phone, grade, section, student_no), institutions(name, city)")
    .eq("id", orderId)
    .single();
  if (error || !order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("id");

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("id", { ascending: false })
    .limit(1);

  const { data: shipments } = await supabase
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .order("id", { ascending: false })
    .limit(1);

  const st = statusLabel(order.status);
  const student = order.users as any;
  const institution = order.institutions as any;
  const payment = payments?.[0];
  const shipment = shipments?.[0];

  function nextStatus(current: string): { status: string; label: string } | null {
    switch (current) {
      case "waiting_approval":
        return { status: "preparing", label: "Hazırlanıyor olarak işaretle" };
      case "preparing":
        return { status: "shipped", label: "Kargoya verildi olarak işaretle" };
      default:
        return null;
    }
  }

  const next = nextStatus(order.status);

  return (
    <Shell role="admin" name={user.full_name}>
      <Link href="/admin/siparisler" className="text-sm text-brand hover:underline">
        ← Siparişlere dön
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Sipariş #{order.id}</h1>
        <span className={`badge ${st.cls}`}>{st.text}</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {new Date(order.created_at).toLocaleString("tr-TR")}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Sol: Sipariş kalemleri */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h2 className="font-semibold text-sm text-slate-700">Sipariş kalemleri</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Ürün</th>
                  <th className="px-4 py-2 text-center">Adet</th>
                  <th className="px-4 py-2 text-right">Birim Fiyat</th>
                  <th className="px-4 py-2 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item: any) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium">{item.set_name}</td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{tl(item.price)}</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {tl(Number(item.price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold">Genel Toplam</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-brand">{tl(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Durum güncelleme */}
          {next && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 font-semibold text-sm text-slate-700">Durum güncelle</h2>
              <form action={updateOrderStatus} className="flex gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="status" value={next.status} />
                <button className="btn-primary">
                  {next.label}
                </button>
                {order.status !== "cancelled" && (
                  <>
                    <input type="hidden" name="cancelOrderId" value={order.id} />
                  </>
                )}
              </form>
              {order.status !== "cancelled" && order.status !== "shipped" && order.status !== "delivered" && (
                <form action={updateOrderStatus} className="mt-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition">
                    Siparişi iptal et
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Sağ: Detay kartları */}
        <div className="space-y-4">
          {/* Öğrenci bilgileri */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 font-semibold text-sm text-slate-700">Öğrenci</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-400">Ad Soyad</dt>
                <dd className="font-medium">{student?.full_name}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Telefon</dt>
                <dd>{student?.phone}</dd>
              </div>
              {student?.grade && (
                <div>
                  <dt className="text-slate-400">Sınıf / Şube</dt>
                  <dd>{student.grade}. sınıf {student.section && `/ ${student.section}`}</dd>
                </div>
              )}
              {student?.student_no && (
                <div>
                  <dt className="text-slate-400">Öğrenci No</dt>
                  <dd>{student.student_no}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Kurum */}
          {institution && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 font-semibold text-sm text-slate-700">Kurum</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-400">Kurum Adı</dt>
                  <dd className="font-medium">{institution.name}</dd>
                </div>
                {institution.city && (
                  <div>
                    <dt className="text-slate-400">Şehir</dt>
                    <dd>{institution.city}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Teslimat adresi */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 font-semibold text-sm text-slate-700">Teslimat adresi</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-400">Alıcı</dt>
                <dd className="font-medium">{order.recipient_name}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Telefon</dt>
                <dd>{order.recipient_phone}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Adres</dt>
                <dd>{order.address}</dd>
              </div>
              <div>
                <dt className="text-slate-400">İlçe / İl</dt>
                <dd>{order.district} / {order.city}</dd>
              </div>
            </dl>
          </div>

          {/* Ödeme */}
          {payment && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 font-semibold text-sm text-slate-700">Ödeme</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-400">Sağlayıcı</dt>
                  <dd>{payment.provider}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Durum</dt>
                  <dd>{payment.status === "success" ? "Başarılı" : "Başarısız"}</dd>
                </div>
                {payment.transaction_id && (
                  <div>
                    <dt className="text-slate-400">İşlem No</dt>
                    <dd className="font-mono text-xs">{payment.transaction_id}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Kargo */}
          {shipment && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 font-semibold text-sm text-slate-700">Kargo</h2>
              <dl className="space-y-2 text-sm">
                {shipment.carrier && (
                  <div>
                    <dt className="text-slate-400">Kargo Firması</dt>
                    <dd>{shipment.carrier}</dd>
                  </div>
                )}
                {shipment.tracking_no && (
                  <div>
                    <dt className="text-slate-400">Takip No</dt>
                    <dd className="font-mono">{shipment.tracking_no}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
