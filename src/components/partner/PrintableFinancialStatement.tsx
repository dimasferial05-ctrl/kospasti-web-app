"use client";

import React from "react";
import {
  Printer,
  X,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import {
  FinancialReportItem,
  FinancialReportSummary,
  formatRupiah,
  formatDateIndo,
} from "@/lib/financial-report-generator";

interface PrintableFinancialStatementProps {
  items: FinancialReportItem[];
  summary: FinancialReportSummary;
  onClose: () => void;
}

export function PrintableFinancialStatement({
  items,
  summary,
  onClose,
}: PrintableFinancialStatementProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Outer Card Container */}
      <div className="bg-white dark:bg-slate-950 w-full max-w-5xl rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 dark:border-slate-800 shadow-float min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col overflow-hidden print:border-0 print:shadow-none print:max-h-none print:min-h-0 print:w-full">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="p-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                Pratinjau Laporan Keuangan
              </h3>
              <p className="text-[11px] text-slate-500">
                Format siap cetak atau simpan ke PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-float transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau"
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 text-slate-800 dark:text-slate-200 print:overflow-visible print:p-0 print:space-y-4 font-sans">
          {/* Header Kop Dokumen */}
          <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-emerald-600 tracking-tight">
                  KosPasti
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Buku Kas Mitra
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Laporan Rekapitulasi Pendapatan &amp; Reservasi
              </h1>
              <p className="text-xs text-slate-500">
                Daftar pembayaran sewa dan status pencairan dana rekening bersama (Escrow).
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs shrink-0 bg-slate-50 dark:bg-slate-900 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none w-full sm:w-auto">
              <div>
                <span className="text-slate-400 font-medium">Periode: </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {summary.period_label}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Properti: </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {summary.property_label}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Tanggal Cetak: </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {summary.generated_at}
                </span>
              </div>
            </div>
          </div>

          {/* Kotak Ringkasan Finansial (KPI Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Omzet Kotor
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatRupiah(summary.total_gross_revenue)}
              </p>
              <span className="text-[10px] text-slate-500">
                {summary.total_transactions} transaksi
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Biaya Admin Platform
              </span>
              <p className="text-base sm:text-lg font-black text-slate-600 dark:text-slate-300 mt-1">
                {formatRupiah(summary.total_admin_fee)}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">
                Bebas potongan mitra
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Sudah Cair ke Rekening
              </span>
              <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(summary.total_paid_payout)}
              </p>
              <span className="text-[10px] text-emerald-700 font-medium">
                Masuk mutasi bank
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Menunggu Pencairan
              </span>
              <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                {formatRupiah(summary.total_pending_payout)}
              </p>
              <span className="text-[10px] text-amber-700 font-medium">
                Dalam proses verifikasi
              </span>
            </div>
          </div>

          {/* Tabel Rincian Transaksi */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-2 text-center w-8">No</th>
                  <th className="py-2.5 px-2">Penyewa &amp; WhatsApp</th>
                  <th className="py-2.5 px-2">Kos &amp; Kamar</th>
                  <th className="py-2.5 px-2">Tgl Masuk</th>
                  <th className="py-2.5 px-2 text-right">Total Bayar</th>
                  <th className="py-2.5 px-2 text-right">Bersih Mitra</th>
                  <th className="py-2.5 px-2 text-center">Status Pencairan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-400 font-medium italic"
                    >
                      Tidak ada transaksi pada periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 print:hover:bg-transparent"
                    >
                      <td className="py-2.5 px-2 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.student_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.student_whatsapp}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                          {item.property_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.room_type_name}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {formatDateIndo(item.move_in_date)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatRupiah(item.gross_amount)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatRupiah(item.net_amount)}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {item.payout_status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Sudah Cair</span>
                          </span>
                        ) : item.payout_status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Menunggu Cair</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {item.booking_status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Table Footer: Total */}
              {items.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-800 font-black text-xs bg-slate-50 dark:bg-slate-900">
                    <td colSpan={4} className="py-3 px-2 text-right uppercase tracking-wider">
                      Total Rekapitulasi:
                    </td>
                    <td className="py-3 px-2 text-right text-slate-900 dark:text-white">
                      {formatRupiah(summary.total_gross_revenue)}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(summary.total_net_revenue)}
                    </td>
                    <td className="py-3 px-2 text-center text-[10px] text-slate-500 font-semibold">
                      {summary.total_transactions} Unit
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Footer Pengesahan & Catatan Resmi */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Catatan Transparansi Escrow:
              </p>
              <p>
                Dana sewa diteruskan ke rekening mitra maksimal 12 jam setelah penyewa melakukan konfirmasi check-in.
              </p>
            </div>
            <div className="text-left sm:text-right font-medium">
              <p>KosPasti Financial System</p>
              <p className="text-[10px]">Dokumen Sah Cetak Elektronik</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintableFinancialStatement;

