// SMS / OTP gönderim adapteri. SMS_PROVIDER env değişkeni ile sağlayıcı seçilir.
// mock (varsayılan): kodu sunucu konsoluna yazar — geliştirme için.
// netgsm / twilio: gerçek entegrasyon için iskelet (kimlik bilgileri .env'den).

type SmsResult = { ok: boolean; provider: string; info?: string };

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER || "mock";
  switch (provider) {
    case "netgsm":
      return sendViaNetgsm(phone, message);
    case "twilio":
      return sendViaTwilio(phone, message);
    default:
      // eslint-disable-next-line no-console
      console.log(`\n📱 [MOCK SMS] -> ${phone}\n${message}\n`);
      return { ok: true, provider: "mock", info: "Konsola yazıldı" };
  }
}

async function sendViaNetgsm(phone: string, message: string): Promise<SmsResult> {
  const { NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_HEADER } = process.env;
  if (!NETGSM_USERCODE || !NETGSM_PASSWORD) {
    return { ok: false, provider: "netgsm", info: "Netgsm kimlik bilgileri eksik (.env)" };
  }
  const params = new URLSearchParams({
    usercode: NETGSM_USERCODE,
    password: NETGSM_PASSWORD,
    gsmno: phone.replace("+9", "9"),
    message,
    msgheader: NETGSM_HEADER || "",
  });
  const res = await fetch("https://api.netgsm.com.tr/sms/send/get", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const text = await res.text();
  // Netgsm 00/01/02 ile başlayan kodlarda başarı döner.
  const ok = /^0[0-2]/.test(text.trim());
  return { ok, provider: "netgsm", info: text };
}

async function sendViaTwilio(phone: string, message: string): Promise<SmsResult> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    return { ok: false, provider: "twilio", info: "Twilio kimlik bilgileri eksik (.env)" };
  }
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: TWILIO_FROM, Body: message }).toString(),
    }
  );
  return { ok: res.ok, provider: "twilio", info: String(res.status) };
}
