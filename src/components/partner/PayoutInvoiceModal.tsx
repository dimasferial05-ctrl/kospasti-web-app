"use client";

import React from "react";
import {
  X,
  Printer,
  Receipt,
  Building2,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Percent,
  ShieldCheck,
  Zap,
} from "lucide-react";

export interface PayoutInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: {
    id: string;
    booking_id: string;
    amount: number;
    gross_amount?: number;
    platform_fee?: number;
    net_amount?: number;
    status: string;
    payout_method_snapshot?: string | null;
    disbursement_id?: string | null;
    disbursement_reference_no?: string | null;
    disbursement_provider?: string | null;
    processed_at?: string | null;
    processed_by?: string | null;
    notes?: string | null;
    created_at: string;
    booking?: {
      id?: string;
      student_name?: string;
      student_whatsapp?: string;
      move_in_date?: string;
      checkin_confirmed_at?: string | null;
      property?: {
        id?: string;
        name?: string;
      };
    };
  } | null;
  partnerName?: string;
}

export function PayoutInvoiceModal({
  isOpen,
  onClose,
  payout,
  partnerName,
}: PayoutInvoiceModalProps) {
  if (!isOpen || !payout) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Safe parsing for calculations with fallback
  const gross =
    payout.gross_amount && payout.gross_amount > 0
      ? payout.gross_amount
      : payout.amount || 0;
  const fee =
    payout.platform_fee && payout.platform_fee > 0
      ? payout.platform_fee
      : Math.round(gross * 0.03);
  const net =
    payout.net_amount && payout.net_amount > 0
      ? payout.net_amount
      : Math.max(0, gross - fee);

  // Parsing snapshot rekening
  let accountInfo: { bank_name?: string; account_number?: string; account_holder?: string } | null = null;
  if (payout.payout_method_snapshot) {
    try {
      accountInfo = JSON.parse(payout.payout_method_snapshot);
    } catch {
      accountInfo = null;
    }
  }

  const invoiceNumber = `INV-PAY-${payout.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float overflow-hidden flex flex-col print:border-0 print:shadow-none print:max-h-none print:w-full animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal Bar (Hidden in Print) */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                Bukti Pencairan Dana (Invoice Payout)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dokumen resmi rincian pencairan dana sewa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-soft transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              aria-label="Tutup invoice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200 print:p-6 print:space-y-4">
          {/* Top Brand & Status */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  KosPasti
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Escrow Payout
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Platform Kepastian &amp; Pembayaran Sewa Kos Terpercaya
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Nomor Referensi
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
                {invoiceNumber}
              </span>
              {payout.disbursement_reference_no && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60 block sm:inline-block">
                  <Zap className="w-3 h-3 text-indigo-600" />
                  <span>Ref Bank: {payout.disbursement_reference_no}</span>
                </span>
              )}
              <div className="mt-1">
                {payout.status === "PAYOUT_PAID" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Sudah Ditransfer</span>
                  </span>
                ) : payout.status === "PAYOUT_FAILED" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>Pencairan Gagal</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Menunggu Proses Transfer</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                Informasi Properti &amp; Penyewa
              </span>
              <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{payout.booking?.property?.name || "-"}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{payout.booking?.student_name || "Penyewa"}</span>
              </p>
              <p className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Check-in: {formatDate(payout.booking?.checkin_confirmed_at || payout.booking?.move_in_date)}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                Rekening Tujuan Pencairan
              </span>
              <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{accountInfo?.bank_name || "Rekening Terdaftar"}</span>
              </p>
              <p className="text-slate-700 dark:text-slate-200 font-mono text-[11px]">
                No: {accountInfo?.account_number || "-"}
              </p>
              <p className="text-slate-500 text-[11px]">
                a.n. {accountInfo?.account_holder || partnerName || "Pemilik Kos"}
              </p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Rincian Perhitungan Finansial
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Nilai Sewa Masuk (Gross)</span>
                <span className="font-semibold">{formatRupiah(gross)}</span>
              </div>

              <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Potongan Komisi Platform KosPasti (3%)</span>
                </div>
                <span className="font-semibold">- {formatRupiah(fee)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Dana Bersih Diterima (Net)
                </span>
                <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(net)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Jaminan Transparansi Sistem Escrow KosPasti</span>
            </div>
            <p>
              Dana dicairkan setelah penyewa mengonfirmasi check-in fisik di kos dan masa tenggang (grace period) 12 jam selesai tanpa sengketa.
              {payout.processed_at && (
                <span className="block mt-0.5 text-slate-400">
                  Diproses pada: {formatDate(payout.processed_at)} {payout.processed_by ? `(oleh: ${payout.processed_by})` : ""}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayoutInvoiceModal;
