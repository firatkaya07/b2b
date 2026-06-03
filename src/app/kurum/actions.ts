"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { run } from "@/lib/db";

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
    await run(
      `INSERT INTO users (role, full_name, phone, institution_id, grade, section, student_no)
       VALUES ('student',?,?,?,?,?,?)`,
      [
        String(formData.get("full_name")),
        normalizePhone(String(formData.get("phone"))),
        user.institution_id,
        String(formData.get("grade")),
        String(formData.get("section")),
        String(formData.get("student_no")),
      ]
    );
  } catch {
    /* benzersiz telefon ihlali */
  }
  revalidatePath("/kurum/ogrenciler");
}
