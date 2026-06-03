"use client";

import { useFormState, useFormStatus } from "react-dom";
import { checkout, type CheckoutState } from "../actions";

function Pay() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full" disabled={pending}>
      {pending ? "İşleniyor…" : "Öde ve siparişi tamamla"}
    </button>
  );
}

export default function CheckoutForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useFormState<CheckoutState, FormData>(checkout, {
    ok: false,
    message: "",
  });

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">Alıcı ad soyad</label>
        <input name="recipient_name" className="input" defaultValue={defaultName} required />
      </div>
      <div>
        <label className="label">Telefon</label>
        <input name="recipient_phone" className="input" placeholder="05XX XXX XX XX" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">İl</label>
          <input name="city" className="input" required />
        </div>
        <div>
          <label className="label">İlçe</label>
          <input name="district" className="input" required />
        </div>
      </div>
      <div>
        <label className="label">Açık adres</label>
        <textarea name="address" className="input" rows={3} required />
      </div>
      {state.message && !state.ok && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.message}</p>
      )}
      <Pay />
    </form>
  );
}
