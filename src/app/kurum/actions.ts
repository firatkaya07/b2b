"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { supabase } from "@/lib/db";

function normalizePhone(raw: string): string {
  let d = raw.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("90")) d = d.slice(2);
  return "+90" + d;
}

// Kurum yetkilisi yalnızca kendi kurumuna öğrenci ekleyebilir.
export async function createStudent(formData: FormData) {
  const user = await requireRole("institution");
  if (!user.institution_id) return;
  try {
    const { error } = await supabase.from("users").insert({
      role: "student",
      full_name: String(formData.get("full_name")),
      phone: normalizePhone(String(formData.get("phone"))),
      institution_id: user.institution_id,
      grade: String(formData.get("grade")),
      section: String(formData.get("section")),
      student_no: String(formData.get("student_no")),
    });
    if (error) throw error;
  } catch {
    /* benzersiz telefon ihlali */
  }
  revalidatePath("/kurum/ogrenciler");
}
