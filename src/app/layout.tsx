import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kitap Seti Platformu",
  description: "Kurumlara özel kitap seti satış platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
