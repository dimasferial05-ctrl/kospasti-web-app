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
  Download,
  Percent,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { ExportFinancialModal } from "@/components/partner/ExportFinancialModal";
import { PayoutInvoiceModal } from "@/components/partner/PayoutInvoiceModal";

interface PayoutRecord {
  id: string;
  booking_id: string;
  amount: number;
  gross_amount?: number;
  platform_fee?: number;
  net_amount?: number;
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
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedInvoicePayout, setSelectedInvoicePayout] = useState<PayoutRecord | null>(null);

  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/partner/payouts");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPayouts(data.data);
      }

      // Ambil seluruh data booking untuk kelengkapan ekspor finansial
      try {
        const bRes = await fetch("/api/partner/bookings");
        const bData = await bRes.json();
        if (bData.success && Array.isArray(bData.bookings)) {
          setAllBookings(bData.bookings);
        }
      } catch {
        // Fallback memakai data booking dari payout
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

  const getPayoutMetrics = (p: PayoutRecord) => {
    const gross = p.gross_amount && p.gross_amount > 0 ? p.gross_amount : p.amount || 0;
    const fee = p.platform_fee && p.platform_fee > 0 ? p.platform_fee : Math.round(gross * 0.03);
    const net = p.net_amount && p.net_amount > 0 ? p.net_amount : Math.max(0, gross - fee);
    return { gross, fee, net };
  };

  const totalGross = payouts.reduce((acc, curr) => acc + getPayoutMetrics(curr).gross, 0);
  const totalPlatformFee = payouts.reduce((acc, curr) => acc + getPayoutMetrics(curr).fee, 0);
  const totalNetPaid = payouts
    .filter((p) => p.status === "PAYOUT_PAID")
    .reduce((acc, curr) => acc + getPayoutMetrics(curr).net, 0);
  const totalPending = payouts
    .filter((p) => p.status === "PAYOUT_PENDING")
    .reduce((acc, curr) => acc + getPayoutMetrics(curr).net, 0);

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

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Laporan Keuangan</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
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

      {/* 4 Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Nilai Sewa Masuk (Gross) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Sewa (Gross)
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatRupiah(totalGross)}
            </p>
            <span className="text-[10px] text-slate-400 font-medium block">
              Nilai transaksi bruto penyewa
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Potongan Komisi Platform (3%) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Komisi Platform (3%)
            </span>
            <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {formatRupiah(totalPlatformFee)}
            </p>
            <span className="text-[10px] text-indigo-500 font-medium block">
              Tarif komisi platform 3%
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Dana Bersih Cair (Net Paid) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Bersih Cair
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatRupiah(totalNetPaid)}
            </p>
            <span className="text-[10px] text-emerald-600/80 font-medium block">
              Sudah masuk rekening mitra
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Menunggu Pencairan (Pending Escrow) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Menunggu Pencairan
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatRupiah(totalPending)}
            </p>
            <span className="text-[10px] text-amber-600/80 font-medium block">
              Ditahan di sistem Escrow
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
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
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Penyewa &amp; Kos</th>
                  <th className="py-3.5 px-4">Tanggal Check-In</th>
                  <th className="py-3.5 px-4 text-right">Nilai Sewa (Gross)</th>
                  <th className="py-3.5 px-4 text-right">Komisi (3%)</th>
                  <th className="py-3.5 px-4 text-right">Dana Bersih (Net)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {payouts.map((p) => {
                  const metrics = getPayoutMetrics(p);
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

                      <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <div className="font-medium">
                          {formatDate(p.booking?.checkin_confirmed_at || p.booking?.move_in_date)}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {p.booking?.checkin_confirmed_at ? "Dikonfirmasi Mitra" : "Jadwal Masuk"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-medium text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                        {formatRupiah(metrics.gross)}
                      </td>

                      <td className="py-4 px-4 text-right font-medium text-indigo-600 dark:text-indigo-400 text-xs whitespace-nowrap">
                        - {formatRupiah(metrics.fee)}
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                        {formatRupiah(metrics.net)}
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {statusBadge}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoicePayout(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all hover:-translate-y-px active:scale-95 cursor-pointer"
                            title="Lihat Bukti Invoice Payout"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ekspor Laporan Finansial */}
      <ExportFinancialModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        bookings={
          allBookings.length > 0
            ? allBookings
            : payouts.map((p) => ({
                id: p.booking_id,
                student_name: p.booking?.student_name,
                student_whatsapp: p.booking?.student_whatsapp,
                move_in_date: p.booking?.move_in_date,
                created_at: p.created_at,
                amount: p.amount,
                status: p.status === "PAYOUT_PAID" ? "COMPLETED" : "PAYOUT_PENDING",
                property: p.booking?.property,
                payout: p,
              }))
        }
      />

      {/* Modal Bukti Invoice Payout Individual */}
      <PayoutInvoiceModal
        isOpen={Boolean(selectedInvoicePayout)}
        onClose={() => setSelectedInvoicePayout(null)}
        payout={selectedInvoicePayout}
      />
    </div>
  );
}
