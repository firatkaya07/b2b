import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import Shell from "@/components/Shell";
import { createStudent } from "../actions";

export default async function StudentsPage() {
  const user = await requireRole("admin");

  // Fetch students with institution name via foreign key relationship
  const { data: students, error: studErr } = await supabase
    .from("users")
    .select("*, institutions(name)")
    .eq("role", "student")
    .order("full_name");
  if (studErr) throw studErr;

  // Flatten institution_name
  const studentsWithInst = (students ?? []).map((s: any) => ({
    ...s,
    institution_name: s.institutions?.name ?? "",
  }));
  // Sort by institution name, grade, section, full_name
  studentsWithInst.sort((a: any, b: any) =>
    `${a.institution_name}|${a.grade}|${a.section}|${a.full_name}`.localeCompare(
      `${b.institution_name}|${b.grade}|${b.section}|${b.full_name}`
    )
  );

  const { data: institutions, error: instErr } = await supabase
    .from("institutions")
    .select("id, name")
    .order("name");
  if (instErr) throw instErr;

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
              {studentsWithInst.map((s: any) => (
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
            {(institutions ?? []).map((i) => (
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
