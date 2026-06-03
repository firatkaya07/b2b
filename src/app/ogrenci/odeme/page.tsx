import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCart, cartTotal } from "@/lib/queries";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  const user = await requireRole("student");
  const lines = await getCart(user.id);
  if (lines.length === 0) redirect("/ogrenci/sepet");
  const total = await cartTotal(user.id);

  return (
    <Shell role="student" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Teslimat ve ödeme</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold">Teslimat adresi</h2>
          <CheckoutForm defaultName={user.full_name} />
        </div>
        <div>
          <div className="card sticky top-6">
            <h2 className="mb-3 font-semibold">Sipariş özeti</h2>
            <ul className="space-y-2 text-sm">
              {lines.map((l) => (
                <li key={l.set_id} className="flex justify-between">
                  <span className="text-slate-600">
                    {l.name} × {l.quantity}
                  </span>
                  <span>{tl(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="my-3 border-t border-slate-100" />
            <div className="flex justify-between font-semibold">
              <span>Toplam</span>
              <span className="text-brand">{tl(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
