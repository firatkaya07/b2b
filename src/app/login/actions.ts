"use server";

import { supabase } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { createSession } from "@/lib/session";
import type { User } from "@/lib/types";

// Telefon numarasını +90XXXXXXXXXX formatına normalize eder.
function normalizePhone(raw: string): string {
  let d = raw.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("90")) d = d.slice(2);
  return "+90" + d;
}

export interface OtpRequestState {
  ok: boolean;
  message: string;
  phone?: string;
  devCode?: string; // yalnızca mock SMS modunda kolaylık için
}

export async function requestOtp(
  _prev: OtpRequestState,
  formData: FormData
): Promise<OtpRequestState> {
  const phone = normalizePhone(String(formData.get("phone") || ""));
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .eq("is_active", 1)
    .single();

  // Sisteme kullanıcı tanımlanmadıysa giriş yapamaz.
  if (error || !user) {
    return {
      ok: false,
      message: "Bu telefon numarası sistemde tanımlı değil. Lütfen kurumunuzla iletişime geçin.",
    };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 3 * 60 * 1000; // 3 dakika
  const { error: insertErr } = await supabase
    .from("otp_codes")
    .insert({ phone, code, expires_at: expires });
  if (insertErr) throw insertErr;

  await sendSms(phone, `Kitap Seti Platformu giriş kodunuz: ${code} (3 dk geçerli)`);

  const isMock = (process.env.SMS_PROVIDER || "mock") === "mock";
  return {
    ok: true,
    message: "Doğrulama kodu telefonunuza gönderildi.",
    phone,
    devCode: isMock ? code : undefined,
  };
}

export interface OtpVerifyState {
  ok: boolean;
  message: string;
  redirect?: string;
}

export async function verifyOtp(
  _prev: OtpVerifyState,
  formData: FormData
): Promise<OtpVerifyState> {
  const phone = normalizePhone(String(formData.get("phone") || ""));
  const code = String(formData.get("code") || "").trim();

  const { data: row, error } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("phone", phone)
    .eq("consumed", 0)
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error || !row) return { ok: false, message: "Aktif bir kod bulunamadı. Tekrar kod isteyin." };
  if (row.attempts >= 5)
    return { ok: false, message: "Çok fazla hatalı deneme. Yeni kod isteyin." };
  if (Date.now() > Number(row.expires_at))
    return { ok: false, message: "Kodun süresi doldu. Yeni kod isteyin." };

  if (row.code !== code) {
    await supabase
      .from("otp_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    return { ok: false, message: "Kod hatalı. Lütfen tekrar deneyin." };
  }

  await supabase.from("otp_codes").update({ consumed: 1 }).eq("id", row.id);

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();
  if (!user) return { ok: false, message: "Kullanıcı bulunamadı." };

  await createSession({ uid: user.id, role: user.role, name: user.full_name });

  const redirect =
    user.role === "admin" ? "/admin" : user.role === "institution" ? "/kurum" : "/ogrenci";
  return { ok: true, message: "Giriş başarılı", redirect };
}
