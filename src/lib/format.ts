export function tl(n: number | string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(n));
}

export function statusLabel(s: string): { text: string; cls: string } {
  switch (s) {
    case "paid":
      return { text: "Ödendi", cls: "bg-emerald-100 text-emerald-700" };
    case "shipped":
      return { text: "Kargoda", cls: "bg-blue-100 text-blue-700" };
    case "delivered":
      return { text: "Teslim edildi", cls: "bg-emerald-100 text-emerald-700" };
    case "cancelled":
      return { text: "İptal", cls: "bg-red-100 text-red-700" };
    default:
      return { text: "Bekliyor", cls: "bg-amber-100 text-amber-700" };
  }
}
