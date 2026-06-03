import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { visibleSetsForStudent, booksInSet } from "@/lib/queries";
import { tl } from "@/lib/format";
import Shell from "@/components/Shell";

export default async function StudentHome() {
  const user = await requireRole("student");
  const sets = await visibleSetsForStudent(user);
  const counts = await Promise.all(sets.map((s) => booksInSet(s.id)));

  return (
    <Shell role="student" name={user.full_name}>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Size atanan setler</h1>
        <p className="text-sm text-slate-500">
          {user.grade}. sınıf / {user.section} şubesi · Öğrenci no: {user.student_no}
        </p>
      </div>

      {sets.length === 0 ? (
        <div className="card text-sm text-slate-500">
          Şu anda size atanmış bir set bulunmuyor.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((s, i) => (
            <Link key={s.id} href={`/ogrenci/setler/${s.id}`} className="card hover:shadow-md">
              <div className="mb-2 flex items-start justify-between">
                <h2 className="font-semibold">{s.name}</h2>
                <span className="badge bg-brand-light text-brand-dark">{s.grade}. sınıf</span>
              </div>
              {s.description && <p className="mb-3 text-sm text-slate-500">{s.description}</p>}
              <p className="text-sm text-slate-500">{counts[i].length} kitap içerir</p>
              <p className="mt-2 text-lg font-bold text-brand">{tl(Number(s.price))}</p>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
