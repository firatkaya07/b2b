"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { run } from "@/lib/db";
import {
  addToCart as addToCartQ,
  removeFromCart as removeFromCartQ,
  getCart,
  cartTotal,
  clearCart,
  getSet,
  canStudentSeeSet,
} from "@/lib/queries";
import { startPayment } from "@/lib/payment";
import { createShipment } from "@/lib/cargo";

export async function addToCart(formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "student") redirect("/login");
  const setId = Number(formData.get("setId"));
  const set = await getSet(setId);
  // Yetki: öğrenci yalnızca kendisine görünür setleri ekleyebilir.
  if (!set || !canStudentSeeSet(user!, set)) return;
  await addToCartQ(user!.id, setId);
  revalidatePath("/ogrenci/sepet");
  redirect("/ogrenci/sepet");
}

export async function removeFromCart(formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "student") redirect("/login");
  await removeFromCartQ(user!.id, Number(formData.get("setId")));
  revalidatePath("/ogrenci/sepet");
}

export interface CheckoutState {
  ok: boolean;
  message: string;
}

export async function checkout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const user = await currentUser();
  if (!user || user.role !== "student") redirect("/login");

  const lines = await getCart(user!.id);
  if (lines.length === 0) return { ok: false, message: "Sepetiniz boş." };

  const recipient = String(formData.get("recipient_name") || "").trim();
  const phone = String(formData.get("recipient_phone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const district = String(formData.get("district") || "").trim();
  const address = String(formData.get("address") || "").trim();
  if (!recipient || !phone || !city || !district || !address) {
    return { ok: false, message: "Lütfen tüm teslimat alanlarını doldurun." };
  }

  const total = await cartTotal(user!.id);

  // 1) Siparişi oluştur
  const order = await run(
    `INSERT INTO orders (user_id, institution_id, status, total, recipient_name,
      recipient_phone, city, district, address)
     VALUES (?,?,?,?,?,?,?,?,?) RETURNING id`,
    [user!.id, user!.institution_id, "pending", total, recipient, phone, city, district, address]
  );
  const orderId = order.id!;

  for (const l of lines) {
    await run(
      "INSERT INTO order_items (order_id, set_id, set_name, price, quantity) VALUES (?,?,?,?,?)",
      [orderId, l.set_id, l.name, l.price, l.quantity]
    );
  }

  // 2) Ödemeyi başlat
  const pay = await startPayment({
    orderId,
    amount: total,
    buyerName: recipient,
    buyerPhone: phone,
    address,
    city,
  });
  await run(
    "INSERT INTO payments (order_id, provider, status, transaction_id) VALUES (?,?,?,?)",
    [orderId, pay.provider, pay.ok ? "success" : "failed", pay.transactionId || null]
  );

  if (!pay.ok) {
    await run("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
    return { ok: false, message: "Ödeme başarısız: " + (pay.info || "") };
  }
  // Gerçek sağlayıcıda 3D/iframe için yönlendirme gerekirse:
  if (pay.redirectUrl) redirect(pay.redirectUrl);

  await run("UPDATE orders SET status = 'paid' WHERE id = ?", [orderId]);

  // 3) Kargo oluştur
  const ship = await createShipment({
    orderId,
    recipientName: recipient,
    recipientPhone: phone,
    city,
    district,
    address,
  });
  if (ship.ok) {
    await run(
      "INSERT INTO shipments (order_id, carrier, tracking_no, status) VALUES (?,?,?,?)",
      [orderId, ship.carrier, ship.trackingNo || null, "created"]
    );
    await run("UPDATE orders SET status = 'shipped' WHERE id = ?", [orderId]);
  }

  await clearCart(user!.id);
  redirect(`/ogrenci/siparisler?yeni=${orderId}`);
}
