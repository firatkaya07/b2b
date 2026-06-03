import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSet, booksInSet, canStudentSeeSet } from "@/lib/queries";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";
import { addToCart } from "../../actions";

export default async function SetDetail({ params }: { params: { id: string } }) {
  const user = await requireRole("student");
  const set = await getSet(Number(params.id));
  // Giriş yapmadan / yetkisi olmayan set görüntülenemez.
  if (!set || !canStudentSeeSet(user, set)) notFound();

  const books = await booksInSet(set.id);

  return (
    <Shell role="student" name={user.full_name}>
      <Link href="/ogrenci" className="text-sm text-brand hover:underline">
        ← Setlere dön
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-semibold">{set.name}</h1>
          {set.description && <p className="mt-1 text-slate-500">{set.description}</p>}
          <div className="mt-2 flex gap-2 text-xs">
            <span className="badge bg-brand-light text-brand-dark">{set.grade}. sınıf</span>
            {set.section && <span className="badge bg-slate-100 text-slate-600">{set.section} şubesi</span>}
            {set.teacher && <span className="badge bg-slate-100 text-slate-600">{set.teacher}</span>}
          </div>

          <h2 className="mb-3 mt-6 font-semibold">Set içindeki kitaplar</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Kitap</th>
                  <th className="px-4 py-2">Yayınevi</th>
                  <th className="px-4 py-2 text-center">Adet</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <div className="font-medium">{b.title}</div>
                      <div className="text-xs text-slate-400">{b.author}</div>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{b.publisher}</td>
                    <td className="px-4 py-2 text-center">{b.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card sticky top-6">
            <p className="text-sm text-slate-500">Set fiyatı</p>
            <p className="mb-4 text-3xl font-bold text-brand">{tl(set.price)}</p>
            <form action={addToCart}>
              <input type="hidden" name="setId" value={set.id} />
              <button className="btn-primary w-full">Sepete ekle</button>
            </form>
            <p className="mt-3 text-xs text-slate-400">
              Ürünler vereceğiniz adrese kargolanır.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
