import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";
import Shell from "@/components/Shell";
import { createInstitution, createInstitutionUser } from "../actions";

export default async function InstitutionsPage() {
  const user = await requireRole("admin");

  const [{ data: institutions, error: instErr }, { data: reps, error: repsErr }] =
    await Promise.all([
      supabase
        .from("institutions")
        .select("id, name, city, contact_name")
        .order("name"),
      supabase
        .from("users")
        .select("full_name, phone, institution_id")
        .eq("role", "institution"),
    ]);
  if (instErr) throw instErr;
  if (repsErr) throw repsErr;

  return (
    <Shell role="admin" name={user.full_name}>
      <h1 className="mb-5 text-xl font-semibold">Kurumlar</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {(institutions ?? []).map((i) => (
            <div key={i.id} className="card">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-sm text-slate-500">
                    {i.city} · İletişim: {i.contact_name}
                  </p>
                </div>
                <span className="text-xs text-slate-400">#{i.id}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Yetkililer:{" "}
                {(reps ?? [])
                  .filter((r) => Number(r.institution_id) === Number(i.id))
                  .map((r) => `${r.full_name} (${r.phone})`)
                  .join(", ") || "—"}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <form action={createInstitution} className="card space-y-3">
            <h2 className="font-semibold">Yeni kurum</h2>
            <input name="name" className="input" placeholder="Kurum adı" required />
            <input name="city" className="input" placeholder="Şehir" />
            <input name="contact_name" className="input" placeholder="İletişim kişisi" />
            <button className="btn-primary w-full">Kurum ekle</button>
          </form>

          <form action={createInstitutionUser} className="card space-y-3">
            <h2 className="font-semibold">Kurum yetkilisi ekle</h2>
            <select name="institution_id" className="input" required>
              <option value="">Kurum seçin</option>
              {(institutions ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <input name="full_name" className="input" placeholder="Ad soyad" required />
            <input name="phone" className="input" placeholder="Telefon (05XX...)" required />
            <button className="btn-primary w-full">Yetkili ekle</button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
