"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Building,
  User,
  CreditCard,
  RefreshCw,
  Search,
  Check,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  X,
} from "lucide-react";

interface PayoutRecord {
  id: string;
  booking_id: string;
  amount: number;
  status: string;
  payout_method_snapshot: string | null;
  processed_at: string | null;
  processed_by: string | null;
  notes: string | null;
  created_at: string;
  booking: {
    id: string;
    student_name: string;
    student_whatsapp: string;
    move_in_date: string;
    checkin_confirmed_at: string | null;
    property: {
      id: string;
      name: string;
    };
    user?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  owner: {
    id: string;
    name: string;
    whatsapp_number: string;
    email: string | null;
    payout_method?: {
      id: string;
      bank_name: string;
      account_number: string;
      account_holder: string;
      is_verified: boolean;
      verified_at: string | null;
    } | null;
  };
}

interface PayoutMethodRecord {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  owner: {
    id: string;
    name: string;
    whatsapp_number: string;
    email: string | null;
  };
}

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<"PENDING" | "PAID" | "ALL" | "ACCOUNTS">("PENDING");
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State for Processing Payout
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
  const [payoutNotes, setPayoutNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Verifying Account State
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [resPayouts, resMethods] = await Promise.all([
        fetch("/api/admin/payouts"),
        fetch("/api/admin/payout-methods"),
      ]);

      const dataPayouts = await resPayouts.json();
      if (dataPayouts.success && Array.isArray(dataPayouts.data)) {
        setPayouts(dataPayouts.data);
      }

      const dataMethods = await resMethods.json();
      if (dataMethods.success && Array.isArray(dataMethods.data)) {
        setPayoutMethods(dataMethods.data);
      }
    } catch (err) {
      console.error("Gagal memuat data payout admin:", err);
      showToast("error", "Gagal memuat data payout.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleProcessPayout = async () => {
    if (!selectedPayout) return;

    if (!selectedPayout.owner.payout_method || !selectedPayout.owner.payout_method.is_verified) {
      showToast("error", "Rekening mitra belum diverifikasi. Harap verifikasi rekening terlebih dahulu.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/payouts/${selectedPayout.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: payoutNotes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses payout.");
      }

      showToast("success", data.message || "Payout berhasil diproses ke rekening mitra!");
      setSelectedPayout(null);
      setPayoutNotes("");
      fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Terjadi kesalahan saat memproses payout.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAccount = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/admin/payout-methods/${id}/verify`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memverifikasi rekening.");
      }

      showToast("success", data.message || "Rekening mitra berhasil diverifikasi!");
      fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Terjadi kesalahan saat memverifikasi rekening.");
    } finally {
      setVerifyingId(null);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingPayouts = payouts.filter((p) => p.status === "PAYOUT_PENDING");
  const paidPayouts = payouts.filter((p) => p.status === "PAYOUT_PAID");
  const unverifiedAccounts = payoutMethods.filter((m) => !m.is_verified);

  const filteredPayouts = payouts.filter((p) => {
    if (activeTab === "PENDING" && p.status !== "PAYOUT_PENDING") return false;
    if (activeTab === "PAID" && p.status !== "PAYOUT_PAID") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOwner = p.owner.name.toLowerCase().includes(q) || p.owner.whatsapp_number.includes(q);
      const matchProperty = p.booking.property.name.toLowerCase().includes(q);
      const matchTenant = p.booking.student_name.toLowerCase().includes(q);
      return matchOwner || matchProperty || matchTenant;
    }

    return true;
  });

  const filteredAccounts = payoutMethods.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.owner.name.toLowerCase().includes(q) ||
        m.owner.whatsapp_number.includes(q) ||
        m.bank_name.toLowerCase().includes(q) ||
        m.account_number.includes(q) ||
        m.account_holder.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto space-y-8 overflow-y-auto w-full">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pencairan Dana Mitra (Payout)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola pencairan dana sewa dari rekening penampung (Escrow) ke rekening bank / e-wallet mitra pemilik kos.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Menunggu Payout
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {pendingPayouts.length}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Nominal Antrean
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white truncate">
              {formatRupiah(pendingPayouts.reduce((a, b) => a + b.amount, 0))}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Sudah Cair
            </span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              {formatRupiah(paidPayouts.reduce((a, b) => a + b.amount, 0))}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Rekening Belum Verif
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {unverifiedAccounts.length}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "PENDING"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Proses ({pendingPayouts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "PAID"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sudah Diproses ({paidPayouts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Semua ({payouts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ACCOUNTS")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "ACCOUNTS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verifikasi Rekening Mitra ({unverifiedAccounts.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "ACCOUNTS" ? "Cari mitra / rekening..." : "Cari mitra / kos / penyewa..."}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm">Memuat data...</p>
          </div>
        ) : activeTab === "ACCOUNTS" ? (
          // TAB PANEL VERIFIKASI REKENING MITRA
          filteredAccounts.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <CreditCard className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tidak ada rekening mitra yang sesuai
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Mitra Pemilik</th>
                    <th className="py-3.5 px-6">Bank / E-Wallet</th>
                    <th className="py-3.5 px-6">Nomor Rekening</th>
                    <th className="py-3.5 px-6">Nama Pemilik Rekening</th>
                    <th className="py-3.5 px-6">Status Verifikasi</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredAccounts.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {m.owner.name}
                        </div>
                        <a
                          href={`https://wa.me/${m.owner.whatsapp_number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          {m.owner.whatsapp_number}
                        </a>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {m.bank_name}
                      </td>

                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {m.account_number}
                      </td>

                      <td className="py-4 px-6 text-slate-800 dark:text-slate-200 text-xs">
                        {m.account_holder}
                      </td>

                      <td className="py-4 px-6">
                        {m.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                            <Clock className="w-3 h-3" />
                            Belum Diverifikasi
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {!m.is_verified ? (
                          <button
                            type="button"
                            disabled={verifyingId === m.id}
                            onClick={() => handleVerifyAccount(m.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {verifyingId === m.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            Verifikasi
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sudah Aktif</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // TAB PANEL PAYOUTS (PENDING, PAID, ALL)
          filteredPayouts.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Wallet className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Belum ada transaksi payout pada filter ini
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Mitra & WhatsApp</th>
                    <th className="py-3.5 px-6">Kos & Penyewa</th>
                    <th className="py-3.5 px-6">Nominal Payout</th>
                    <th className="py-3.5 px-6">Rekening Tujuan</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredPayouts.map((p) => {
                    const method = p.owner.payout_method;
                    const isMethodVerified = Boolean(method?.is_verified);

                    let statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        <Clock className="w-3 h-3" />
                        Menunggu Proses
                      </span>
                    );

                    if (p.status === "PAYOUT_PAID") {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" />
                          Sudah Cair
                        </span>
                      );
                    } else if (p.status === "PAYOUT_FAILED") {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                          <XCircle className="w-3 h-3" />
                          Gagal
                        </span>
                      );
                    }

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {p.owner.name}
                          </div>
                          <a
                            href={`https://wa.me/${p.owner.whatsapp_number.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            {p.owner.whatsapp_number}
                          </a>
                        </td>

                        <td className="py-4 px-6 space-y-0.5 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {p.booking.property.name}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Penyewa: {p.booking.student_name}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                          {formatRupiah(p.amount)}
                        </td>

                        <td className="py-4 px-6 text-xs space-y-0.5">
                          {method ? (
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {method.bank_name} - <span className="font-mono">{method.account_number}</span>
                              </p>
                              <p className="text-slate-500 dark:text-slate-400">a.n. {method.account_holder}</p>
                              {isMethodVerified ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-3 h-3" /> Rekening Terverifikasi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                  <AlertCircle className="w-3 h-3" /> Belum Diverifikasi
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-rose-500 italic">Belum mengisi rekening</span>
                          )}
                        </td>

                        <td className="py-4 px-6">{statusBadge}</td>

                        <td className="py-4 px-6 text-right">
                          {p.status === "PAYOUT_PENDING" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPayout(p);
                                setPayoutNotes("");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              Proses Payout
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {p.processed_at ? formatDate(p.processed_at) : "Selesai"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* MODAL KONFIRMASI PROSES PAYOUT */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Konfirmasi Pencairan Dana (Payout)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ID Booking: {selectedPayout.booking_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian Penerima & Nominal */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Mitra Penerima:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPayout.owner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor WhatsApp:</span>
                <span className="font-mono text-slate-900 dark:text-white">{selectedPayout.owner.whatsapp_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Properti Kos:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedPayout.booking.property.name}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Nominal yang Dicairkan:</span>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(selectedPayout.amount)}
                </span>
              </div>
            </div>

            {/* Rekening Tujuan Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Rekening Tujuan Transfer:
              </span>
              {selectedPayout.owner.payout_method ? (
                <>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedPayout.owner.payout_method.bank_name} - {selectedPayout.owner.payout_method.account_number}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    a.n. <strong className="text-slate-900 dark:text-white">{selectedPayout.owner.payout_method.account_holder}</strong>
                  </p>
                  {!selectedPayout.owner.payout_method.is_verified && (
                    <p className="text-rose-600 font-bold pt-1 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Peringatan: Rekening ini belum diverifikasi. Harap verifikasi terlebih dahulu di tab Verifikasi Rekening Mitra.</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-rose-600 font-bold">Mitra belum mendaftarkan rekening pembayaran.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Internal Admin (Opsional)
              </label>
              <input
                type="text"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Contoh: Transfer via VA BCA batch #1234"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setSelectedPayout(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || !selectedPayout.owner.payout_method?.is_verified}
                onClick={handleProcessPayout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Konfirmasi & Cairkan Dana"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
