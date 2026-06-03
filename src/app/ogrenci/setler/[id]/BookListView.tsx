"use client";

import { useState } from "react";
import type { Book } from "@/lib/types";
import { tl } from "@/lib/format";

interface BookWithQty extends Book {
  quantity: number;
}

export default function BookListView({ books }: { books: BookWithQty[] }) {
  const [view, setView] = useState<"card" | "list">("card");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Set i&ccedil;indeki kitaplar</h2>
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
          <button
            onClick={() => setView("card")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${
              view === "card"
                ? "bg-brand text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Kart
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 border-l border-slate-200 px-3 py-1.5 text-xs font-medium transition ${
              view === "list"
                ? "bg-brand text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Liste
          </button>
        </div>
      </div>

      {view === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {books.map((b) => (
            <div
              key={b.id}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
            >
              {b.image_url ? (
                <img
                  src={b.image_url}
                  alt={b.title}
                  className="h-28 w-20 flex-shrink-0 rounded-lg object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-28 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold leading-tight">{b.title}</h3>
                  {b.author && (
                    <p className="mt-1 text-xs text-slate-500">{b.author}</p>
                  )}
                  {b.publisher && (
                    <p className="mt-0.5 text-xs text-slate-400">{b.publisher}</p>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-brand">{tl(b.price)}</span>
                  {b.quantity > 1 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {b.quantity} adet
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Kitap</th>
                <th className="px-4 py-2">Yay&#305;nevi</th>
                <th className="px-4 py-2 text-right">Fiyat</th>
                <th className="px-4 py-2 text-center">Adet</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {b.image_url ? (
                        <img
                          src={b.image_url}
                          alt={b.title}
                          className="h-12 w-9 flex-shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-9 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{b.title}</div>
                        {b.author && <div className="text-xs text-slate-400">{b.author}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{b.publisher}</td>
                  <td className="px-4 py-2 text-right font-medium">{tl(b.price)}</td>
                  <td className="px-4 py-2 text-center">{b.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
