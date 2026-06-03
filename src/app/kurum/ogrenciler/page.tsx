import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import Shell from "@/components/Shell";
import { createStudent } from "../actions";

export default async function KurumStudents() {
  const user = await requireRole("institution");
  const { data: students, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "student")
    .eq("institution_id", user.institution_id!)
    .order("grade")
    .order("section")
    .order("full_name");
  if (error) throw error;

  return (
    <Shell role="institution" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Öğrencilerim</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Ad Soyad</th>
                <th className="px-3 py-2">Sınıf/Şube</th>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {(students ?? []).map((s: any) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{s.full_name}</td>
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
