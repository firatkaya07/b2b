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

export async function createInstitution(formData: FormData) {
  await requireRole("admin");
  await run("INSERT INTO institutions (name, city, contact_name) VALUES (?,?,?)", [
    String(formData.get("name")),
    String(formData.get("city") || ""),
    String(formData.get("contact_name") || ""),
  ]);
  revalidatePath("/admin/kurumlar");
}

export async function createInstitutionUser(formData: FormData) {
  await requireRole("admin");
  try {
    await run(
      `INSERT INTO users (role, full_name, phone, institution_id) VALUES ('institution',?,?,?)`,
      [
        String(formData.get("full_name")),
        normalizePhone(String(formData.get("phone"))),
        Number(formData.get("institution_id")),
      ]
    );
  } catch {
    /* benzersiz telefon ihlali sessizce geçilir */
  }
  revalidatePath("/admin/kurumlar");
}

export async function createBook(formData: FormData) {
  await requireRole("admin");
  await run("INSERT INTO books (title, author, publisher, isbn, price) VALUES (?,?,?,?,?)", [
    String(formData.get("title")),
    String(formData.get("author") || ""),
    String(formData.get("publisher") || ""),
    String(formData.get("isbn") || ""),
    Number(formData.get("price") || 0),
  ]);
  revalidatePath("/admin/kitaplar");
}

export async function createSet(formData: FormData) {
  await requireRole("admin");
  const res = await run(
    `INSERT INTO sets (institution_id, name, grade, section, teacher, description, price)
     VALUES (?,?,?,?,?,?,?) RETURNING id`,
    [
      Number(formData.get("institution_id")),
      String(formData.get("name")),
      String(formData.get("grade")),
      String(formData.get("section") || "") || null,
      String(formData.get("teacher") || "") || null,
      String(formData.get("description") || ""),
      Number(formData.get("price") || 0),
    ]
  );
  const setId = res.id!;

  const bookIds = formData.getAll("book_ids").map((v) => Number(v));
  for (const id of bookIds) {
    await run(
      "INSERT INTO set_books (set_id, book_id, quantity) VALUES (?,?,1) ON CONFLICT DO NOTHING",
      [setId, id]
    );
  }
  revalidatePath("/admin/setler");
}

export async function createStudent(formData: FormData) {
  await requireRole("admin");
  try {
    await run(
      `INSERT INTO users (role, full_name, phone, institution_id, grade, section, student_no)
       VALUES ('student',?,?,?,?,?,?)`,
      [
        String(formData.get("full_name")),
        normalizePhone(String(formData.get("phone"))),
        Number(formData.get("institution_id")),
        String(formData.get("grade")),
        String(formData.get("section")),
        String(formData.get("student_no")),
      ]
    );
  } catch {
    /* benzersiz telefon ihlali */
  }
  revalidatePath("/admin/ogrenciler");
}
