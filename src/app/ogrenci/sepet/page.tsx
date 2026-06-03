import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getCart, cartTotal } from "@/lib/queries";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";
import { removeFromCart } from "../actions";

export default async function CartPage() {
  const user = await requireRole("student");
  const lines = await getCart(user.id);
  const total = await cartTotal(user.id);

  return (
    <Shell role="student" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Sepetim</h1>

      {lines.length === 0 ? (
        <div className="card text-sm text-slate-500">
          Sepetiniz boş.{" "}
          <Link href="/ogrenci" className="text-brand hover:underline">
            Setlere göz atın
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {lines.map((l) => (
              <div key={l.set_id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium">{l.name}</p>
                  <p className="text-sm text-slate-500">
                    {tl(l.price)} × {l.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{tl(l.price * l.quantity)}</span>
                  <form action={removeFromCart}>
                    <input type="hidden" name="setId" value={l.set_id} />
                    <button className="text-sm text-red-600 hover:underline">Kaldır</button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="card sticky top-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ara toplam</span>
                <span>{tl(total)}</span>
              </div>
              <div className="my-3 border-t border-slate-100" />
              <div className="flex justify-between font-semibold">
                <span>Toplam</span>
                <span className="text-brand">{tl(total)}</span>
              </div>
              <Link href="/ogrenci/odeme" className="btn-primary mt-4 w-full">
                Ödemeye geç
              </Link>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
