"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Building2,
  User,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

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
  };
}

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/partner/payouts");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPayouts(data.data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar payout:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPayouts();
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

  const totalPaid = payouts
    .filter((p) => p.status === "PAYOUT_PAID")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPending = payouts
    .filter((p) => p.status === "PAYOUT_PENDING")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto space-y-8 overflow-y-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Riwayat Pencairan Dana (Payout)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar dana sewa yang dicairkan dari sistem Escrow ke rekening bank / e-wallet Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/partner/dashboard/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Kelola Rekening
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Sudah Cair
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatRupiah(totalPaid)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Menunggu Pencairan
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatRupiah(totalPending)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Transaksi Payout
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {payouts.length} Kali
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm">Memuat riwayat payout...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Wallet className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Belum ada riwayat pencairan dana
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pencairan dana otomatis dibuat setelah Anda mengonfirmasi check-in penyewa dan masa grace period 12 jam selesai tanpa sanggahan.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Penyewa & Kos</th>
                  <th className="py-3.5 px-6">Tanggal Check-In</th>
                  <th className="py-3.5 px-6">Nominal Payout</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Tanggal Proses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {payouts.map((p) => {
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
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {p.booking?.student_name || "Penyewa Kos"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" />
                          {p.booking?.property?.name || "-"}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                        <div className="font-medium">
                          {formatDate(p.booking?.checkin_confirmed_at || p.booking?.move_in_date)}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {p.booking?.checkin_confirmed_at ? "Dikonfirmasi Mitra" : "Jadwal Masuk"}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {formatRupiah(p.amount)}
                      </td>

                      <td className="py-4 px-6">{statusBadge}</td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                        {p.processed_at ? (
                          <div>
                            <p className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatDate(p.processed_at)}
                            </p>
                            <p className="text-[10px] text-slate-400">Oleh: {p.processed_by || "Admin"}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Menunggu verifikasi admin</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
