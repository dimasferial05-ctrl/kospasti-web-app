import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/shared/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KosPasti 🏠 - Kepastian Kos Real-Time",
  description:
    "Platform Web Pencarian Kos (PWA) yang memberikan kepastian ketersediaan kamar secara real-time dan effortless.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}
