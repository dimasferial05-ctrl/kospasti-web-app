"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Building,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Edit2,
  Plus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

const BANK_OPTIONS = [
  "BCA",
  "BNI",
  "BRI",
  "Mandiri",
  "BSI",
  "CIMB Niaga",
  "Permata",
  "Danamon",
  "GoPay",
  "OVO",
  "Dana",
  "ShopeePay",
  "LinkAja",
  "Jenius",
  "SeaBank",
];

interface PayoutMethodData {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_verified: boolean;
  verified_at: string | null;
  updated_at: string;
}

export default function PartnerProfilePage() {
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethodData | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; email: string; whatsapp_number: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resMethod, resMe] = await Promise.all([
        fetch("/api/partner/payout-method"),
        fetch("/api/partner/me"),
      ]);

      const dataMethod = await resMethod.json();
      if (dataMethod.success && dataMethod.data) {
        setPayoutMethod(dataMethod.data);
        setBankName(dataMethod.data.bank_name);
        setAccountNumber(dataMethod.data.account_number);
        setAccountHolder(dataMethod.data.account_holder);
      } else {
        setPayoutMethod(null);
      }

      const dataMe = await resMe.json();
      if (dataMe.authenticated && dataMe.owner) {
        setPartnerInfo(dataMe.owner);
        if (!dataMethod?.data?.account_holder && dataMe.owner.name) {
          setAccountHolder(dataMe.owner.name);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      showToast("error", "Gagal memuat profil dan rekening.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber.trim() || !accountHolder.trim()) {
      showToast("error", "Semua data rekening wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/partner/payout-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: bankName,
          account_number: accountNumber.trim(),
          account_holder: accountHolder.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan rekening.");
      }

      setPayoutMethod(data.data);
      setIsEditing(false);
      showToast("success", "Rekening berhasil disimpan! Menunggu verifikasi admin.");
    } catch (err: any) {
      showToast("error", err.message || "Terjadi kesalahan saat menyimpan rekening.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto space-y-8 overflow-y-auto w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in slide-in-from-bottom duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-700/60"
              : "bg-rose-950/90 text-rose-200 border-rose-700/60"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Profil & Rekening Mitra
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola informasi profil pemilik kos dan metode pencairan dana (payout) sewa kos.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm text-slate-500">Memuat data rekening...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Profil Mitra */}
          <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                {partnerInfo?.name ? partnerInfo.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {partnerInfo?.name || "Mitra Kos"}
                </h3>
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  Pemilik Properti
                </span>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Email Terdaftar</p>
                <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                  {partnerInfo?.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">WhatsApp</p>
                <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                  {partnerInfo?.whatsapp_number || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Card Rekening Pencairan Dana */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Rekening Pencairan Dana
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rekening bank / e-wallet untuk menerima hasil sewa setelah penyewa check-in.
                  </p>
                </div>
              </div>

              {payoutMethod && !isEditing && (
                <div className="flex items-center gap-2">
                  {payoutMethod.is_verified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                      <Clock className="w-3.5 h-3.5" />
                      Belum Diverifikasi
                    </span>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Ubah
                  </button>
                </div>
              )}
            </div>

            {/* Konten Rekening: Read-only atau Form */}
            {!payoutMethod && !isEditing ? (
              // Empty State
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div className="max-w-md">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Belum Ada Rekening Pencairan
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Anda belum mendaftarkan nomor rekening bank atau e-wallet. Rekening dibutuhkan agar hasil sewa dapat dicairkan oleh sistem KosPasti.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Rekening Pembayaran
                </button>
              </div>
            ) : isEditing ? (
              // Form Edit / Tambah Rekening
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p>
                    <strong>Perhatian:</strong> Rekening yang diubah atau baru disimpan memerlukan verifikasi ulang oleh tim Admin KosPasti sebelum payout dapat diproses. Pastikan nama pemilik rekening sama persis dengan rekening buku tabungan.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pilihan Bank / E-Wallet <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nomor Rekening / Nomor HP E-Wallet <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Contoh: 1234567890 / 08123456789"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Pemilik Rekening <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="HARUS sama persis dengan nama di rekening bank"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Pastikan ejaan nama sesuai dengan mutasi / buku tabungan bank Anda.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {payoutMethod && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setBankName(payoutMethod.bank_name);
                        setAccountNumber(payoutMethod.account_number);
                        setAccountHolder(payoutMethod.account_holder);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Rekening"
                    )}
                  </button>
                </div>
              </form>
            ) : payoutMethod ? (
              // Read-only State
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {payoutMethod.bank_name}
                    </span>
                    <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                      {payoutMethod.account_number}
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      a.n. <span className="font-semibold">{payoutMethod.account_holder}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    {payoutMethod.is_verified ? (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 sm:justify-end">
                        <CheckCircle2 className="w-4 h-4" />
                        Siap Menerima Payout
                      </div>
                    ) : (
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 sm:justify-end">
                        <Clock className="w-4 h-4" />
                        Menunggu Verifikasi Admin
                      </div>
                    )}
                  </div>
                </div>

                {!payoutMethod.is_verified && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
                    ℹ️ Rekening Anda sedang dalam antrean verifikasi oleh Admin KosPasti. Payout baru dapat ditransfer setelah verifikasi selesai.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
