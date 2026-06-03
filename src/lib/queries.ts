import { supabase } from "./db";
import type { Book, OrderRow, SetRow, User } from "./types";

// Öğrencinin görebileceği setler: aynı kurum + aynı sınıf seviyesi +
// (set şubesi boş VEYA öğrencinin şubesine eşit).
export async function visibleSetsForStudent(student: User): Promise<SetRow[]> {
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("is_active", 1)
    .eq("approval_status", "approved")
    .eq("institution_id", student.institution_id!)
    .eq("grade", student.grade!)
    .or(`section.is.null,section.eq.${student.section}`)
    .order("name");
  if (error) throw error;
  return data as SetRow[];
}

export async function getSet(id: number): Promise<SetRow | undefined> {
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return (data as SetRow) ?? undefined;
}

export async function booksInSet(setId: number): Promise<(Book & { quantity: number })[]> {
  const { data, error } = await supabase
    .from("set_books")
    .select("quantity, books(*)")
    .eq("set_id", setId);
  if (error) throw error;
  // Flatten: each row has { quantity, books: { id, title, ... } }
  return (data ?? []).map((row: any) => ({
    ...row.books,
    quantity: row.quantity,
  })) as (Book & { quantity: number })[];
}

// Bir setin öğrenci tarafından görülebilir olduğunu doğrular (yetki kontrolü).
export function canStudentSeeSet(student: User, set: SetRow): boolean {
  return (
    set.is_active === 1 &&
    set.approval_status === "approved" &&
    Number(set.institution_id) === Number(student.institution_id) &&
    set.grade === student.grade &&
    (set.section === null || set.section === student.section)
  );
}

export interface CartLine {
  set_id: number;
  name: string;
  price: number;
  quantity: number;
}

export async function getCart(userId: number): Promise<CartLine[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("set_id, quantity, sets(name, price)")
    .eq("user_id", userId);
  if (error) throw error;
  // Flatten and sort by name
  const lines = (data ?? []).map((row: any) => ({
    set_id: row.set_id,
    name: row.sets.name,
    price: row.sets.price,
    quantity: row.quantity,
  })) as CartLine[];
  lines.sort((a, b) => a.name.localeCompare(b.name));
  return lines;
}

export async function cartTotal(userId: number): Promise<number> {
  const lines = await getCart(userId);
  return lines.reduce((t, l) => t + Number(l.price) * l.quantity, 0);
}

export async function addToCart(userId: number, setId: number) {
  // Try to get existing cart item
  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", userId)
    .eq("set_id", setId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("user_id", userId)
      .eq("set_id", setId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: userId, set_id: setId, quantity: 1 });
    if (error) throw error;
  }
}

export async function removeFromCart(userId: number, setId: number) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("set_id", setId);
  if (error) throw error;
}

export async function clearCart(userId: number) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

export async function ordersForUser(userId: number): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: false });
  if (error) throw error;
  return data as OrderRow[];
}

export async function orderItems(orderId: number) {
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (error) throw error;
  return data as { id: number; set_name: string; price: number; quantity: number }[];
}
