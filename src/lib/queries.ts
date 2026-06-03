import { q, one, run } from "./db";
import type { Book, OrderRow, SetRow, User } from "./types";

// Öğrencinin görebileceği setler: aynı kurum + aynı sınıf seviyesi +
// (set şubesi boş VEYA öğrencinin şubesine eşit).
export function visibleSetsForStudent(student: User): Promise<SetRow[]> {
  return q<SetRow>(
    `SELECT * FROM sets
     WHERE is_active = 1
       AND institution_id = ?
       AND grade = ?
       AND (section IS NULL OR section = ?)
     ORDER BY name`,
    [student.institution_id, student.grade, student.section]
  );
}

export function getSet(id: number): Promise<SetRow | undefined> {
  return one<SetRow>("SELECT * FROM sets WHERE id = ?", [id]);
}

export function booksInSet(setId: number): Promise<(Book & { quantity: number })[]> {
  return q<Book & { quantity: number }>(
    `SELECT b.*, sb.quantity FROM set_books sb
     JOIN books b ON b.id = sb.book_id
     WHERE sb.set_id = ? ORDER BY b.title`,
    [setId]
  );
}

// Bir setin öğrenci tarafından görülebilir olduğunu doğrular (yetki kontrolü).
export function canStudentSeeSet(student: User, set: SetRow): boolean {
  return (
    set.is_active === 1 &&
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

export function getCart(userId: number): Promise<CartLine[]> {
  return q<CartLine>(
    `SELECT c.set_id, s.name, s.price, c.quantity FROM cart_items c
     JOIN sets s ON s.id = c.set_id WHERE c.user_id = ? ORDER BY s.name`,
    [userId]
  );
}

export async function cartTotal(userId: number): Promise<number> {
  const lines = await getCart(userId);
  return lines.reduce((t, l) => t + Number(l.price) * l.quantity, 0);
}

export async function addToCart(userId: number, setId: number) {
  await run(
    `INSERT INTO cart_items (user_id, set_id, quantity) VALUES (?,?,1)
     ON CONFLICT (user_id, set_id) DO UPDATE SET quantity = cart_items.quantity + 1`,
    [userId, setId]
  );
}

export async function removeFromCart(userId: number, setId: number) {
  await run("DELETE FROM cart_items WHERE user_id = ? AND set_id = ?", [userId, setId]);
}

export async function clearCart(userId: number) {
  await run("DELETE FROM cart_items WHERE user_id = ?", [userId]);
}

export function ordersForUser(userId: number): Promise<OrderRow[]> {
  return q<OrderRow>("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", [userId]);
}

export function orderItems(orderId: number) {
  return q<{ id: number; set_name: string; price: number; quantity: number }>(
    "SELECT * FROM order_items WHERE order_id = ?",
    [orderId]
  );
}
