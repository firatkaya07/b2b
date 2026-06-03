// Kargo adapteri. CARGO_PROVIDER: mock | aras | yurtici
// mock: sahte takip numarası üretir. Gerçek entegrasyonlar SOAP/REST iskeletiyle hazır.

export interface ShipmentRequest {
  orderId: number;
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  address: string;
}

export interface ShipmentResult {
  ok: boolean;
  carrier: string;
  trackingNo?: string;
  info?: string;
}

export async function createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
  const provider = process.env.CARGO_PROVIDER || "mock";
  switch (provider) {
    case "aras":
      return createAras(req);
    case "yurtici":
      return createYurtici(req);
    default:
      return {
        ok: true,
        carrier: "MOCK Kargo",
        trackingNo: "TR" + String(req.orderId).padStart(6, "0") + Date.now().toString().slice(-4),
        info: "Mock kargo oluşturuldu",
      };
  }
}

// Aras Kargo: SetOrder SOAP servisi kullanılır.
async function createAras(req: ShipmentRequest): Promise<ShipmentResult> {
  const { ARAS_USERNAME, ARAS_PASSWORD } = process.env;
  if (!ARAS_USERNAME || !ARAS_PASSWORD) {
    return { ok: false, carrier: "aras", info: "Aras kimlik bilgileri eksik (.env)" };
  }
  // TODO: Aras SetOrder SOAP isteğini gönderip dönen takip kodunu trackingNo yapın.
  return { ok: false, carrier: "aras", info: "Aras SetOrder çağrısını ekleyin." };
}

// Yurtiçi Kargo: createShipment REST/SOAP servisi.
async function createYurtici(req: ShipmentRequest): Promise<ShipmentResult> {
  const { YURTICI_USERNAME, YURTICI_PASSWORD } = process.env;
  if (!YURTICI_USERNAME || !YURTICI_PASSWORD) {
    return { ok: false, carrier: "yurtici", info: "Yurtiçi kimlik bilgileri eksik (.env)" };
  }
  // TODO: Yurtiçi createShipment isteğini ekleyin.
  return { ok: false, carrier: "yurtici", info: "Yurtiçi createShipment çağrısını ekleyin." };
}
