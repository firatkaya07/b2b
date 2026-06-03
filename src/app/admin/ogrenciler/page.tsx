import { requireRole } from "@/lib/auth";
import { q } from "@/lib/db";
import Shell from "@/components/Shell";
import { createStudent } from "../actions";

export default async function StudentsPage() {
  const user = await requireRole("admin");
  const students = await q<any>(
    `SELECT u.*, i.name AS institution_name FROM users u
     LEFT JOIN institutions i ON i.id = u.institution_id
     WHERE u.role='student' ORDER BY i.name, u.grade, u.section, u.full_name`
  );
  const institutions = await q<{ id: number; name: string }>(
    "SELECT id, name FROM institutions ORDER BY name"
  );

  return (
    <Shell role="admin" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Öğrenciler</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Ad Soyad</th>
                <th className="px-3 py-2">Kurum</th>
                <th className="px-3 py-2">Sınıf/Şube</th>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{s.full_name}</td>
                  <td className="px-3 py-2 text-slate-500">{s.institution_name}</td>
                  <td className="px-3 py-2">
                    {s.grade}/{s.section}
                  </td>
                  <td className="px-3 py-2">{s.student_no}</td>
                  <td className="px-3 py-2 text-slate-500">{s.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={createStudent} className="card space-y-3">
          <h2 className="font-semibold">Yeni öğrenci</h2>
          <select name="institution_id" className="input" required>
            <option value="">Kurum seçin</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <input name="full_name" className="input" placeholder="Ad soyad" required />
          <div className="grid grid-cols-2 gap-2">
            <input name="grade" className="input" placeholder="Sınıf" required />
            <input name="section" className="input" placeholder="Şube" required />
          </div>
          <input name="student_no" className="input" placeholder="Öğrenci no" required />
          <input name="phone" className="input" placeholder="Telefon (05XX...)" required />
          <button className="btn-primary w-full">Öğrenci ekle</button>
        </form>
      </div>
    </Shell>
  );
}
