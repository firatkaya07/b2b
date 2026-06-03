"use server";

import { one, run } from "@/lib/db";
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
  const user = await one<User>(
    "SELECT * FROM users WHERE phone = ? AND is_active = 1",
    [phone]
  );

  // Sisteme kullanıcı tanımlanmadıysa giriş yapamaz.
  if (!user) {
    return {
      ok: false,
      message: "Bu telefon numarası sistemde tanımlı değil. Lütfen kurumunuzla iletişime geçin.",
    };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 3 * 60 * 1000; // 3 dakika
  await run("INSERT INTO otp_codes (phone, code, expires_at) VALUES (?,?,?)", [
    phone,
    code,
    expires,
  ]);

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

  const row = await one<{ id: number; code: string; expires_at: number; attempts: number }>(
    `SELECT * FROM otp_codes WHERE phone = ? AND consumed = 0
     ORDER BY id DESC LIMIT 1`,
    [phone]
  );

  if (!row) return { ok: false, message: "Aktif bir kod bulunamadı. Tekrar kod isteyin." };
  if (row.attempts >= 5)
    return { ok: false, message: "Çok fazla hatalı deneme. Yeni kod isteyin." };
  if (Date.now() > Number(row.expires_at))
    return { ok: false, message: "Kodun süresi doldu. Yeni kod isteyin." };

  if (row.code !== code) {
    await run("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?", [row.id]);
    return { ok: false, message: "Kod hatalı. Lütfen tekrar deneyin." };
  }

  await run("UPDATE otp_codes SET consumed = 1 WHERE id = ?", [row.id]);
  const user = (await one<User>("SELECT * FROM users WHERE phone = ?", [phone]))!;
  await createSession({ uid: user.id, role: user.role, name: user.full_name });

  const redirect =
    user.role === "admin" ? "/admin" : user.role === "institution" ? "/kurum" : "/ogrenci";
  return { ok: true, message: "Giriş başarılı", redirect };
}
