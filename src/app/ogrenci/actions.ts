"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { supabase } from "@/lib/db";
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
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user!.id,
      institution_id: user!.institution_id,
      status: "pending",
      total,
      recipient_name: recipient,
      recipient_phone: phone,
      city,
      district,
      address,
    })
    .select("id")
    .single();
  if (orderErr) throw orderErr;
  const orderId = order!.id;

  for (const l of lines) {
    const { error } = await supabase.from("order_items").insert({
      order_id: orderId,
      set_id: l.set_id,
      set_name: l.name,
      price: l.price,
      quantity: l.quantity,
    });
    if (error) throw error;
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
  const { error: payErr } = await supabase.from("payments").insert({
    order_id: orderId,
    provider: pay.provider,
    status: pay.ok ? "success" : "failed",
    transaction_id: pay.transactionId || null,
  });
  if (payErr) throw payErr;

  if (!pay.ok) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    return { ok: false, message: "Ödeme başarısız: " + (pay.info || "") };
  }
  // Gerçek sağlayıcıda 3D/iframe için yönlendirme gerekirse:
  if (pay.redirectUrl) redirect(pay.redirectUrl);

  await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);

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
    await supabase.from("shipments").insert({
      order_id: orderId,
      carrier: ship.carrier,
      tracking_no: ship.trackingNo || null,
      status: "created",
    });
    await supabase.from("orders").update({ status: "shipped" }).eq("id", orderId);
  }

  await clearCart(user!.id);
  redirect(`/ogrenci/siparisler?yeni=${orderId}`);
}
