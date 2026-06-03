export function tl(n: number | string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(n));
}

export function statusLabel(s: string): { text: string; cls: string } {
  switch (s) {
    case "waiting_approval":
      return { text: "Onay bekliyor", cls: "bg-amber-100 text-amber-700" };
    case "preparing":
      return { text: "Hazırlanıyor", cls: "bg-purple-100 text-purple-700" };
    case "shipped":
      return { text: "Kargoya verildi", cls: "bg-blue-100 text-blue-700" };
    case "delivered":
      return { text: "Teslim edildi", cls: "bg-emerald-100 text-emerald-700" };
    case "cancelled":
      return { text: "İptal", cls: "bg-red-100 text-red-700" };
    default:
      return { text: s, cls: "bg-slate-100 text-slate-700" };
  }
}
