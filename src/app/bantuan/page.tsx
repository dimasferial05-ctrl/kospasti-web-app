"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { HELP_CATEGORIES, HelpArticle } from "@/lib/data/help-center";
import { AuroraBackground } from "@/components/ui/aurora-background";
import {
  Search,
  CalendarCheck,
  ShieldAlert,
  MapPin,
  KeyRound,
  Building2,
  Zap,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  Info,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  MessageCircle,
  Share2,
  Clock,
  User,
  Check,
  Heart,
  Star,
} from "lucide-react";

// Icon mapping helper
function renderArticleIcon(name: string, className: string = "w-5 h-5") {
  switch (name) {
    case "Search":
      return <Search className={className} />;
    case "CalendarCheck":
      return <CalendarCheck className={className} />;
    case "ShieldAlert":
      return <ShieldAlert className={className} />;
    case "MapPin":
      return <MapPin className={className} />;
    case "KeyRound":
      return <KeyRound className={className} />;
    case "Building2":
      return <Building2 className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "DollarSign":
      return <DollarSign className={className} />;
    case "TrendingUp":
      return <TrendingUp className={className} />;
    case "Info":
      return <Info className={className} />;
    case "User":
      return <User className={className} />;
    case "Heart":
      return <Heart className={className} />;
    case "Star":
      return <Star className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}

function HelpCenterContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("tab") === "partner" ? "partner" : "user";
  const initialArticleSlug = searchParams.get("article") || "";

  const [activeCategory, setActiveCategory] = useState<"user" | "partner">(initialCategory);
  const [activeArticleSlug, setActiveArticleSlug] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, "yes" | "no" | null>>({});

  // Sync category from URL param if changed
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "partner" || tabParam === "user") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCategory(tabParam);
    }
  }, [searchParams]);

  // Current category data
  const currentCategoryData = useMemo(() => {
    return HELP_CATEGORIES.find((c) => c.id === activeCategory) || HELP_CATEGORIES[0];
  }, [activeCategory]);

  // Filtered articles based on search query
  const filteredArticles = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return currentCategoryData.articles;
    }
    // Search across current category or all articles
    return currentCategoryData.articles.filter((art) => {
      const matchTitle = art.title.toLowerCase().includes(query);
      const matchSubtitle = art.subtitle.toLowerCase().includes(query);
      const matchSummary = art.summary.toLowerCase().includes(query);
      const matchTags = art.tags.some((t) => t.toLowerCase().includes(query));
      const matchSections = art.sections.some(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
      );
      return matchTitle || matchSubtitle || matchSummary || matchTags || matchSections;
    });
  }, [currentCategoryData, searchQuery]);

  // Select active article
  useEffect(() => {
    if (initialArticleSlug) {
      const foundInCurrent = currentCategoryData.articles.find(
        (a) => a.slug === initialArticleSlug
      );
      if (foundInCurrent) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveArticleSlug(foundInCurrent.slug);
        return;
      }
    }

    if (filteredArticles.length > 0) {
      // Keep existing active article if still in filtered list, else pick first
      if (!filteredArticles.some((a) => a.slug === activeArticleSlug)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveArticleSlug(filteredArticles[0].slug);
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveArticleSlug("");
    }
  }, [filteredArticles, currentCategoryData, initialArticleSlug, activeArticleSlug]);

  const activeArticle: HelpArticle | null = useMemo(() => {
    return currentCategoryData.articles.find((a) => a.slug === activeArticleSlug) || filteredArticles[0] || null;
  }, [currentCategoryData, activeArticleSlug, filteredArticles]);

  const handleShareArticle = () => {
    if (typeof window !== "undefined" && activeArticle) {
      const url = `${window.location.origin}/bantuan?tab=${activeCategory}&article=${activeArticle.slug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleRateHelpful = (slug: string, rate: "yes" | "no") => {
    setHelpfulFeedback((prev) => ({ ...prev, [slug]: rate }));
  };

  // Find next and previous articles for navigation
  const currentIndex = activeArticle
    ? currentCategoryData.articles.findIndex((a) => a.slug === activeArticle.slug)
    : -1;
  const prevArticle = currentIndex > 0 ? currentCategoryData.articles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < currentCategoryData.articles.length - 1
      ? currentCategoryData.articles[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Hero Search Section with Aurora Background */}
      <section className="relative bg-zinc-950">
        <AuroraBackground className="py-16 sm:py-24 bg-zinc-950 text-white relative w-full border-b border-white/[0.08]">
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Ada yang bisa kami bantu?
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Temukan jawaban lengkap seputar alur booking, pembayaran DP, garansi refund, serta panduan operasional mitra pemilik kos.
            </p>

            {/* Quick Realtime Search Bar */}
            <div className="max-w-2xl mx-auto pt-3">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik pertanyaan atau kata kunci (contoh: refund, magic link, bayar DP, stok kamar)..."
                  className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-xs font-bold"
                    aria-label="Hapus Pencarian"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </AuroraBackground>
      </section>

      {/* Main Help Center Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1">
        {/* Category Tabs Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl w-full sm:w-auto">
            {HELP_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery("");
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                    isSelected
                      ? "bg-white text-emerald-800 shadow-md border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {cat.id === "user" ? (
                    <User className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                  ) : (
                    <Building2 className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                  )}
                  <span>{cat.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isSelected
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {cat.articles.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-center">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Pilih topik di sebelah kiri untuk membaca panduan detail</span>
          </div>
        </div>

        {/* 2-Column Documentation Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* Left Column: Topic List (Sidebar) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Daftar Panduan ({filteredArticles.length})
                </span>
                {searchQuery && (
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    Hasil Filter
                  </span>
                )}
              </div>

              {filteredArticles.length === 0 ? (
                <div className="p-6 text-center text-slate-500 space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">Tidak ada panduan yang cocok dengan pencarian.</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-emerald-600 hover:underline font-bold"
                  >
                    Reset Filter Pencarian
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[650px] overflow-y-auto pr-1">
                  {filteredArticles.map((article) => {
                    const isSelected = activeArticle?.slug === article.slug;
                    return (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => {
                          setActiveArticleSlug(article.slug);
                          if (window.innerWidth < 1024) {
                            // Scroll to content on mobile
                            document.getElementById("article-view")?.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer group ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15"
                            : "hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100"
                          }`}
                        >
                          {renderArticleIcon(article.iconName, "w-4 h-4")}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 ${
                              isSelected ? "text-white" : "text-slate-900 group-hover:text-emerald-700"
                            }`}
                          >
                            {article.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                                isSelected
                                  ? "bg-white/20 text-emerald-100"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {article.readTime}
                            </span>
                            <span
                              className={`text-[10px] truncate ${
                                isSelected ? "text-emerald-100" : "text-slate-400"
                              }`}
                            >
                              {article.tags[0]}
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isSelected
                              ? "text-white translate-x-0.5"
                              : "text-slate-300 group-hover:text-slate-500"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Contact Support Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white shadow-lg space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Masih Perlu Bantuan?
                  </h4>
                  <p className="text-xs text-white font-semibold">Customer Care KosPasti</p>
                </div>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Tim dukungan kami siap membantu Anda setiap hari pukul 08.00 - 21.00 WIB.
              </p>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20KosPasti,%20saya%20butuh%20bantuan%20terkait%20penggunaan%20aplikasi."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Article Detail Content View */}
          <div id="article-view" className="lg:col-span-8 space-y-6">
            {activeArticle ? (
              <article className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-soft space-y-8 animate-in fade-in duration-200">
                {/* Article Header & Metadata */}
                <div className="space-y-4 pb-6 border-b border-slate-100">
                  {/* Breadcrumbs & Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span>Pusat Bantuan</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <span className="text-emerald-700">{currentCategoryData.shortTitle}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleShareArticle}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        title="Salin Link Panduan"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Link Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Bagikan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                    {activeArticle.title}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                    {activeArticle.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{activeArticle.readTime}</span>
                    </span>
                    {activeArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Summary Highlight Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Poin Kunci Panduan Ini</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {activeArticle.summary}
                  </p>
                </div>

                {/* Formatted Article Body Sections */}
                <div className="space-y-8 text-slate-800 text-sm leading-relaxed">
                  {activeArticle.sections.map((sec, idx) => (
                    <section key={idx} className="space-y-3">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {sec.title}
                      </h3>
                      <div className="text-slate-700 whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                        {sec.content}
                      </div>

                      {/* Tips Callout */}
                      {sec.tips && sec.tips.length > 0 && (
                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2 mt-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wide">
                            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Tips Praktis:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-xs text-blue-950 font-medium">
                            {sec.tips.map((t, tIdx) => (
                              <li key={tIdx} className="leading-relaxed">
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Warning Callout */}
                      {sec.warning && (
                        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1 mt-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 uppercase tracking-wide">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Perhatian Penting:</span>
                          </div>
                          <p className="text-xs text-rose-950 font-medium leading-relaxed">
                            {sec.warning}
                          </p>
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                {/* Helpful Rating Feedback Widget */}
                <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Apakah panduan ini membantu Anda?
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Masukan Anda membantu kami memperbarui kualitas bantuan KosPasti.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {helpfulFeedback[activeArticle.slug] ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Terima kasih atas penilaian Anda!</span>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRateHelpful(activeArticle.slug, "yes")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ya, Membantu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRateHelpful(activeArticle.slug, "no")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />
                          <span>Kurang Jelas</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Navigation Between Articles (Prev / Next) */}
                <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prevArticle ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveArticleSlug(prevArticle.slug);
                        window.scrollTo({ top: 350, behavior: "smooth" });
                      }}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all group"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ← Panduan Sebelumnya
                      </span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1 mt-0.5">
                        {prevArticle.title}
                      </span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextArticle && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveArticleSlug(nextArticle.slug);
                        window.scrollTo({ top: 350, behavior: "smooth" });
                      }}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-right transition-all group"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Panduan Selanjutnya →
                      </span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-1 mt-0.5">
                        {nextArticle.title}
                      </span>
                    </button>
                  )}
                </div>
              </article>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">Pilih topik bantuan di sebelah kiri</h3>
                <p className="text-xs text-slate-500">
                  Seluruh dokumentasi dan FAQ disusun lengkap untuk kenyamanan Anda.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
          Memuat Pusat Bantuan KosPasti...
        </div>
      }
    >
      <HelpCenterContent />
    </Suspense>
  );
}
