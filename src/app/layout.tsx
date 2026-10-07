import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProfileCompletionModal } from "@/components/features/ProfileCompletionModal";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KosPasti 🏠 - Kepastian Kos Real-Time",
  description:
    "Platform Web Pencarian Kos (PWA) yang memberikan kepastian ketersediaan kamar secara real-time dan effortless.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userToken = cookieStore.get("user_token")?.value;
  const isLoggedIn = Boolean(userToken);

  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full scroll-smooth`}>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans min-h-screen flex flex-col">
        <Header isLoggedIn={isLoggedIn} />
        <ProfileCompletionModal />
        <div className="flex-1 pb-20 md:pb-0 flex flex-col">
          {children}
        </div>
        <BottomNav isLoggedIn={isLoggedIn} />
      </body>
    </html>
  );
}
