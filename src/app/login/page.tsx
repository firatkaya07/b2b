"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { requestOtp, verifyOtp, type OtpRequestState, type OtpVerifyState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Lütfen bekleyin…" : label}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const [reqState, reqAction] = useFormState<OtpRequestState, FormData>(requestOtp, {
    ok: false,
    message: "",
  });
  const [verState, verAction] = useFormState<OtpVerifyState, FormData>(verifyOtp, {
    ok: false,
    message: "",
  });

  useEffect(() => {
    if (reqState.ok && reqState.phone) {
      setPhone(reqState.phone);
      setStep("otp");
    }
  }, [reqState]);

  useEffect(() => {
    if (verState.ok && verState.redirect) router.push(verState.redirect);
  }, [verState, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand">Kitap Seti Platformu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Telefon numaranız ve SMS kodu ile giriş yapın
          </p>
        </div>

        <div className="card">
          {step === "phone" ? (
            <form action={reqAction} className="space-y-4">
              <div>
                <label className="label">Telefon numarası</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  className="input"
                  required
                  autoFocus
                />
              </div>
              {reqState.message && !reqState.ok && (
                <p className="text-sm text-red-600">{reqState.message}</p>
              )}
              <SubmitButton label="Kod gönder" />
            </form>
          ) : (
            <form action={verAction} className="space-y-4">
              <input type="hidden" name="phone" value={phone} />
              <div>
                <label className="label">SMS doğrulama kodu</label>
                <input
                  name="code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 haneli kod"
                  className="input tracking-[0.3em]"
                  required
                  autoFocus
                />
                <p className="mt-1 text-xs text-slate-500">{phone} numarasına gönderildi.</p>
              </div>
              {reqState.devCode && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Geliştirme modu kodu: <b>{reqState.devCode}</b>
                </p>
              )}
              {verState.message && !verState.ok && (
                <p className="text-sm text-red-600">{verState.message}</p>
              )}
              <SubmitButton label="Giriş yap" />
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => setStep("phone")}
              >
                Numarayı değiştir
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Yalnızca kurumunuz tarafından sisteme tanımlanmış kullanıcılar giriş yapabilir.
        </p>
      </div>
    </main>
  );
}
