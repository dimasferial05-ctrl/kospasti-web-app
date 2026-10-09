import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProfileCompletionModal } from "@/components/features/ProfileCompletionModal";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PwaUpdater } from "@/components/pwa/PwaUpdater";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "KosPasti 🏠 - Kepastian Kos Real-Time",
  description:
    "Platform Web Pencarian Kos (PWA) yang memberikan kepastian ketersediaan kamar secara real-time dan effortless.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KosPasti",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
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
    <html
      lang="id"
      className={`${plusJakartaSans.variable} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 font-sans min-h-screen flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <Header isLoggedIn={isLoggedIn} />
          <ProfileCompletionModal />
          <div className="flex-1 pb-20 md:pb-0 flex flex-col">
            {children}
          </div>
          <BottomNav isLoggedIn={isLoggedIn} />
          <PwaUpdater />
        </ThemeProvider>
      </body>
    </html>
  );
}
