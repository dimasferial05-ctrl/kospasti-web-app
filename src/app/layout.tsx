import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased font-sans flex flex-col">
        {/* Header Minimalist */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg text-slate-900 tracking-tight hover:opacity-90 transition-opacity"
            >
              <span>🏠</span>
              <span>KosPasti</span>
            </Link>
          </div>
        </header>

        {/* Main Container - Mobile First */}
        <main className="w-full max-w-md mx-auto min-h-[calc(100vh-3.5rem)] bg-white shadow-sm border-x border-slate-100 flex flex-col p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
