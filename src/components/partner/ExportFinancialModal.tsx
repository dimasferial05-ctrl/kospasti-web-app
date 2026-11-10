"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  ReportPeriodFilter,
  PERIOD_LABELS,
  FinancialReportItem,
  mapBookingToReportItem,
  filterFinancialReportItems,
  calculateFinancialSummary,
  generateFinancialCSV,
  formatRupiah,
} from "@/lib/financial-report-generator";
import { PrintableFinancialStatement } from "./PrintableFinancialStatement";

export interface ExportFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: any[];
  properties?: Array<{ id: string; name: string }>;
  ownerName?: string;
  ownerWhatsapp?: string;
}

export function ExportFinancialModal({
  isOpen,
  onClose,
  bookings = [],
  properties = [],
  ownerName,
  ownerWhatsapp,
}: ExportFinancialModalProps) {
  const [selectedPeriod, setSelectedPeriod] =
    useState<ReportPeriodFilter>("THIS_MONTH");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("ALL");
  const [csvDelimiter, setCsvDelimiter] = useState<"," | ";">(",");
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Normalisasi data pemesanan menjadi format item laporan
  const reportItems = useMemo(() => {
    return bookings.map(mapBookingToReportItem);
  }, [bookings]);

  // Ekstrak daftar properti unik jika belum disediakan via props
  const propertyOptions = useMemo(() => {
    if (properties && properties.length > 0) return properties;

    const map = new Map<string, string>();
    for (const b of bookings) {
      if (b.property?.id && b.property?.name) {
        map.set(b.property.id, b.property.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [properties, bookings]);

  // Data hasil filter sesuai pilihan pengguna
  const filteredItems = useMemo(() => {
    return filterFinancialReportItems(
      reportItems,
      selectedPeriod,
      selectedPropertyId
    );
  }, [reportItems, selectedPeriod, selectedPropertyId]);

  // Label properti yang dipilih
  const propertyLabel = useMemo(() => {
    if (selectedPropertyId === "ALL") return "Semua Properti Kos";
    const found = propertyOptions.find((p) => p.id === selectedPropertyId);
    return found ? found.name : "Properti Terpilih";
  }, [selectedPropertyId, propertyOptions]);

  // Rekapitulasi ringkasan angka
  const reportSummary = useMemo(() => {
    return calculateFinancialSummary(
      filteredItems,
      PERIOD_LABELS[selectedPeriod],
      propertyLabel,
      ownerName,
      ownerWhatsapp
    );
  }, [
    filteredItems,
    selectedPeriod,
    propertyLabel,
    ownerName,
    ownerWhatsapp,
  ]);

  // Handler download berkas CSV
  const handleDownloadCSV = () => {
    setIsExporting(true);
    try {
      const csvContent = generateFinancialCSV(filteredItems, reportSummary, {
        delimiter: csvDelimiter,
        includeSepHeader: true,
      });
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStamp = new Date().toISOString().split("T")[0];
      const sanitizedPeriod = selectedPeriod.toLowerCase();
      link.setAttribute(
        "download",
        `Laporan_Keuangan_KosPasti_${sanitizedPeriod}_${dateStamp}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal mengekspor laporan CSV:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-float overflow-hidden flex flex-col my-auto">
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Unduh Laporan Keuangan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rekapitulasi penerimaan sewa &amp; pencairan dana mitra.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal"
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Filter 1: Periode Laporan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilih Periode Waktu</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    "THIS_MONTH",
                    "LAST_MONTH",
                    "LAST_3_MONTHS",
                    "THIS_YEAR",
                    "ALL",
                  ] as ReportPeriodFilter[]
                ).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 border text-center cursor-pointer active:scale-95 ${
                      selectedPeriod === period
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-soft"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {PERIOD_LABELS[period]}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Properti Kos (Jika > 1) */}
            {propertyOptions.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pilih Properti Kos</span>
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="ALL">Semua Properti Kos ({propertyOptions.length} Properti)</option>
                  {propertyOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Count Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 font-medium">Data Terpilih:</span>
                <p className="font-black text-slate-900 dark:text-white text-sm">
                  {filteredItems.length} Transaksi
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-medium">Total Omzet:</span>
                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatRupiah(reportSummary.total_gross_revenue)}
                </p>
              </div>
            </div>

            {/* Pengaturan Pemisah Kolom CSV */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pemisah Kolom Spreadsheet (.csv)
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCsvDelimiter(",")}
                  className={`py-2 px-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    csvDelimiter === ","
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span>Koma ( , )</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Standar
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCsvDelimiter(";")}
                  className={`py-2 px-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    csvDelimiter === ";"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span>Titik Koma ( ; )</span>
                  <span className="text-[10px] text-slate-400">Regional</span>
                </button>
              </div>
            </div>

            {/* Action Cards: Pilihan Format Unduh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option 1: Excel / CSV */}
              <button
                type="button"
                onClick={handleDownloadCSV}
                disabled={isExporting}
                className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-left transition-all duration-200 active:scale-95 group cursor-pointer shadow-soft hover:shadow-float"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-xs">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Unduh Excel / CSV (.csv)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Buka langsung di Microsoft Excel atau Google Sheets.
                </p>
              </button>

              {/* Option 2: PDF / Printable View */}
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all duration-200 active:scale-95 group cursor-pointer shadow-xs hover:shadow-soft"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Printer className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Cetak / Simpan PDF
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Format lembar A4 rapi untuk arsip fisik atau PDF.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable / PDF Preview Modal */}
      {showPrintPreview && (
        <PrintableFinancialStatement
          items={filteredItems}
          summary={reportSummary}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </>
  );
}

export default ExportFinancialModal;

