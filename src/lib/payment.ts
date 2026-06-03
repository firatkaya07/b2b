// Ödeme adapteri. PAYMENT_PROVIDER: mock | iyzico | paytr
// mock: anında başarılı sayar (geliştirme). Gerçek sağlayıcılar için iskelet aşağıda.

export interface PaymentRequest {
  orderId: number;
  amount: number;
  buyerName: string;
  buyerPhone: string;
  address: string;
  city: string;
}

export interface PaymentResult {
  ok: boolean;
  provider: string;
  transactionId?: string;
  // 3D Secure veya hosted ödeme sayfası gerektiren sağlayıcılarda kullanıcıyı yönlendireceğiniz URL.
  redirectUrl?: string;
  info?: string;
}

export async function startPayment(req: PaymentRequest): Promise<PaymentResult> {
  const provider = process.env.PAYMENT_PROVIDER || "mock";
  switch (provider) {
    case "iyzico":
      return payWithIyzico(req);
    case "paytr":
      return payWithPaytr(req);
    default:
      return {
        ok: true,
        provider: "mock",
        transactionId: "MOCK-" + Date.now(),
        info: "Mock ödeme onaylandı",
      };
  }
}

// iyzico: gerçekte iyzipay SDK veya REST imzalı istek kullanılır. Aşağısı bağlanacağınız nokta.
async function payWithIyzico(req: PaymentRequest): Promise<PaymentResult> {
  const { IYZICO_API_KEY, IYZICO_SECRET_KEY } = process.env;
  if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
    return { ok: false, provider: "iyzico", info: "iyzico anahtarları eksik (.env)" };
  }
  // TODO: iyzipay-node ile checkoutFormInitialize çağırın, dönen paymentPageUrl'i redirectUrl yapın.
  // const iyzipay = new Iyzipay({ apiKey, secretKey, uri: IYZICO_BASE_URL });
  // iyzipay.checkoutFormInitialize.create({...}) -> result.paymentPageUrl
  return {
    ok: false,
    provider: "iyzico",
    info: "iyzico entegrasyonu için checkoutFormInitialize çağrısını ekleyin.",
  };
}

// PayTR: iframe tabanlı ödeme. token alıp kullanıcıyı PayTR iframe'ine yönlendirirsiniz.
async function payWithPaytr(req: PaymentRequest): Promise<PaymentResult> {
  const { PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT } = process.env;
  if (!PAYTR_MERCHANT_ID || !PAYTR_MERCHANT_KEY || !PAYTR_MERCHANT_SALT) {
    return { ok: false, provider: "paytr", info: "PayTR anahtarları eksik (.env)" };
  }
  // TODO: PayTR get-token isteğini imzalayıp token alın, redirectUrl = https://www.paytr.com/odeme/guvenli/<token>
  return {
    ok: false,
    provider: "paytr",
    info: "PayTR get-token isteğini ekleyin.",
  };
}
