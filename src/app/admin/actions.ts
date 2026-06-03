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

export async function createInstitution(formData: FormData) {
  await requireRole("admin");
  const { error } = await supabase.from("institutions").insert({
    name: String(formData.get("name")),
    city: String(formData.get("city") || ""),
    contact_name: String(formData.get("contact_name") || ""),
  });
  if (error) throw error;
  revalidatePath("/admin/kurumlar");
}

export async function createInstitutionUser(formData: FormData) {
  await requireRole("admin");
  try {
    const { error } = await supabase.from("users").insert({
      role: "institution",
      full_name: String(formData.get("full_name")),
      phone: normalizePhone(String(formData.get("phone"))),
      institution_id: Number(formData.get("institution_id")),
    });
    if (error) throw error;
  } catch {
    /* benzersiz telefon ihlali sessizce geçilir */
  }
  revalidatePath("/admin/kurumlar");
}

export async function createBook(formData: FormData) {
  await requireRole("admin");
  const { error } = await supabase.from("books").insert({
    title: String(formData.get("title")),
    author: String(formData.get("author") || ""),
    publisher: String(formData.get("publisher") || ""),
    isbn: String(formData.get("isbn") || ""),
    price: Number(formData.get("price") || 0),
    image_url: String(formData.get("image_url") || "") || null,
  });
  if (error) throw error;
  revalidatePath("/admin/kitaplar");
}

export async function createSet(formData: FormData) {
  await requireRole("admin");
  const { data, error } = await supabase
    .from("sets")
    .insert({
      institution_id: Number(formData.get("institution_id")),
      name: String(formData.get("name")),
      grade: String(formData.get("grade")),
      section: String(formData.get("section") || "") || null,
      teacher: String(formData.get("teacher") || "") || null,
      description: String(formData.get("description") || ""),
      price: Number(formData.get("price") || 0),
    })
    .select("id")
    .single();
  if (error) throw error;
  const setId = data!.id;

  const bookIds = formData.getAll("book_ids").map((v) => Number(v));
  for (const id of bookIds) {
    // ON CONFLICT DO NOTHING — ignore duplicates
    await supabase
      .from("set_books")
      .upsert({ set_id: setId, book_id: id, quantity: 1 }, { onConflict: "set_id,book_id" });
  }
  revalidatePath("/admin/setler");
}

export async function createStudent(formData: FormData) {
  await requireRole("admin");
  try {
    const { error } = await supabase.from("users").insert({
      role: "student",
      full_name: String(formData.get("full_name")),
      phone: normalizePhone(String(formData.get("phone"))),
      institution_id: Number(formData.get("institution_id")),
      grade: String(formData.get("grade")),
      section: String(formData.get("section")),
      student_no: String(formData.get("student_no")),
    });
    if (error) throw error;
  } catch {
    /* benzersiz telefon ihlali */
  }
  revalidatePath("/admin/ogrenciler");
}

export async function updateOrderStatus(formData: FormData) {
  await requireRole("admin");
  const orderId = Number(formData.get("orderId"));
  const status = String(formData.get("status"));
  const allowed = ["preparing", "shipped", "cancelled"];
  if (!allowed.includes(status)) return;

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) throw error;
  revalidatePath("/admin/siparisler");
}
