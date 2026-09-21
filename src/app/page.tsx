import React from "react";
import {
  HeroSection,
  RoleCardsSection,
  HowItWorksSection,
  FeaturesSection,
  PartnerCTASection,
  FAQSection,
  LandingFooter,
} from "@/components/landing";

export const metadata = {
  title: "KosPasti 🏠 - Sewa Kos Nyaman & Manajemen Properti Cerdas",
  description:
    "Platform sewa kos terpercaya di Indonesia dengan jaminan kamar real-time, transaksi aman Escrow, ulasan terverifikasi, dan dashboard manajemen mitra kos.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-500 selection:text-white">
      <main className="flex-1 w-full">
        {/* 1. Hero Section with Top Search & Architectural Image Banner */}
        <HeroSection />

        {/* 2. Dual Audience Selector Cards (Pencari Kos vs Pemilik Kos) */}
        <RoleCardsSection />

        {/* 3. How It Works (PWA Desktop + Mobile Showcase + Numbered Steps 1, 2, 3) */}
        <HowItWorksSection />

        {/* 4. Editorial Features Showcase (Review Proof & Smart Automations) */}
        <FeaturesSection />

        {/* 5. Partner / Owner B2B Portal Section */}
        <PartnerCTASection />

        {/* 6. FAQ Accordion */}
        <div id="faq">
          <FAQSection />
        </div>
      </main>

      {/* 7. Clean Modern Footer */}
      <LandingFooter />
    </div>
  );
}
