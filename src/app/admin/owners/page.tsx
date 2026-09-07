"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  MessageSquare,
  Loader2,
  Building2,
  Calendar,
  Link2,
  Copy,
  Check,
  X,
  CheckCircle2,
} from "lucide-react";

interface OwnerItem {
  id: string;
  name: string;
  whatsapp_number: string;
  created_at: string;
  _count?: {
    properties: number;
  };
  properties?: Array<{
    id: string;
    name: string;
  }>;
}

interface GeneratedModalData {
  link: string;
  ownerName: string;
  ownerPhone: string;
}

export default function AdminOwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<OwnerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedModal, setGeneratedModal] = useState<GeneratedModalData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("adminAuth") : "";

    fetch("/api/admin/owners", {
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("adminAuth");
          }
          router.push("/admin");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          setOwners(data.data);
        }
      })
      .catch((err) => {
        console.error("Fetch owners error:", err);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  // Client-side filtering
  const filteredOwners = useMemo(() => {
    if (!searchQuery.trim()) return owners;
    const query = searchQuery.toLowerCase();
    return owners.filter(
      (owner) =>
        owner.name.toLowerCase().includes(query) ||
        owner.whatsapp_number.toLowerCase().includes(query)
    );
  }, [owners, searchQuery]);

  const formatWhatsAppNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return cleaned;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "-";
    }
  };

  const handleGenerateLink = async (owner: OwnerItem) => {
    if (generatingId) return;
    setGeneratingId(owner.id);
    const token = typeof window !== "undefined" ? sessionStorage.getItem("adminAuth") : "";

    try {
      const res = await fetch("/api/magic-link/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ ownerId: owner.id }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.magicLink) {
        setGeneratedModal({
          link: data.magicLink,
          ownerName: owner.name,
          ownerPhone: owner.whatsapp_number,
        });
      } else {
        alert(data.error || "Gagal membuat magic link");
      }
    } catch (err) {
      console.error("Error generating magic link:", err);
      alert("Terjadi kesalahan koneksi saat membuat magic link");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedModal?.link) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedModal.link);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Memuat data pemilik kos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-slate-800" />
            <span>Manajemen Pemilik Kos</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar seluruh pemilik kos (Ibu/Bapak Kos) yang terdaftar di platform KosPasti.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama atau WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Owners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total {filteredOwners.length} Pemilik Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200">Nama Pemilik</th>
                <th className="p-4 border-b border-slate-200">Nomor WhatsApp</th>
                <th className="p-4 border-b border-slate-200 text-center">Jumlah Properti</th>
                <th className="p-4 border-b border-slate-200">Tanggal Terdaftar</th>
                <th className="p-4 border-b border-slate-200 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOwners.map((owner) => {
                const propertyCount =
                  owner._count?.properties ?? owner.properties?.length ?? 0;
                const isGenerating = generatingId === owner.id;

                return (
                  <tr key={owner.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{owner.name}</div>
                      {owner.properties && owner.properties.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {owner.properties.map((p) => p.name).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700 font-mono text-xs">
                        {owner.whatsapp_number}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {propertyCount} Kos
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(owner.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateLink(owner)}
                          disabled={generatingId !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                          title="Buat Magic Link Baru"
                        >
                          {isGenerating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span>{isGenerating ? "Memproses..." : "Generate Link"}</span>
                        </button>
                        <a
                          href={`https://wa.me/${formatWhatsAppNumber(owner.whatsapp_number)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat WA</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {searchQuery
                      ? `Tidak ditemukan pemilik kos dengan kata kunci "${searchQuery}".`
                      : "Belum ada data pemilik kos terdaftar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tautan Magic Link */}
      {generatedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="magic-link-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="magic-link-modal-title" className="text-lg font-bold text-slate-900">
                    Tautan Magic Link Berhasil Dibuat!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Untuk pemilik: <span className="font-semibold text-slate-700">{generatedModal.ownerName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGeneratedModal(null);
                  setCopied(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                URL Magic Link (Berlaku 24 Jam):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedModal.link}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none select-all break-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${copied
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  title="Salin ke Clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Perhatian Keamanan:</p>
              <p className="text-amber-700 leading-relaxed">
                Tautan ini memberikan akses langsung bagi pemilik untuk memperbarui data kos tanpa login. Tautan lama otomatis kedaluwarsa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <a
                href={`https://wa.me/${formatWhatsAppNumber(generatedModal.ownerPhone)}?text=${encodeURIComponent(
                  `Halo ${generatedModal.ownerName},\n\nBerikut adalah tautan rahasia (Magic Link) untuk mengakses dan memperbarui data properti kos Anda di platform KosPasti.\n\n🔗 Tautan: ${generatedModal.link}\n\n⚠️ Catatan: Tautan ini memberikan akses langsung tanpa login dan hanya berlaku selama 24 jam ke depan. Mohon jangan bagikan tautan ini kepada orang lain.\n\nTerima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirim via WA</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setGeneratedModal(null);
                  setCopied(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

