import { requireRole } from "@/lib/auth";
import { q } from "@/lib/db";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";
import { createBook } from "../actions";
import type { Book } from "@/lib/types";

export default async function BooksPage() {
  const user = await requireRole("admin");
  const books = await q<Book>("SELECT * FROM books ORDER BY title");

  return (
    <Shell role="admin" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Kitaplar</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Başlık</th>
                <th className="px-4 py-2">Yazar</th>
                <th className="px-4 py-2">Yayınevi</th>
                <th className="px-4 py-2 text-right">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{b.title}</td>
                  <td className="px-4 py-2 text-slate-500">{b.author}</td>
                  <td className="px-4 py-2 text-slate-500">{b.publisher}</td>
                  <td className="px-4 py-2 text-right">{tl(b.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={createBook} className="card space-y-3">
          <h2 className="font-semibold">Yeni kitap</h2>
          <input name="title" className="input" placeholder="Başlık" required />
          <input name="author" className="input" placeholder="Yazar" />
          <input name="publisher" className="input" placeholder="Yayınevi" />
          <input name="isbn" className="input" placeholder="ISBN" />
          <input name="price" type="number" step="0.01" className="input" placeholder="Fiyat" />
          <button className="btn-primary w-full">Kitap ekle</button>
        </form>
      </div>
    </Shell>
  );
}
