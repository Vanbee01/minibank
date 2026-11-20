import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "MiniBank — Employee Finance", description: "Platform tabungan dan transaksi internal karyawan." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}