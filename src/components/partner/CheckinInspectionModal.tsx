"use client";

import React, { useState } from "react";
import {
  X,
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  Upload,
  Info,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";

interface CheckinInspectionModalProps {
  bookingId: string;
  propertyName: string;
  studentName: string;
  roomUnitNumber?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FacilityCondition = "GOOD" | "DAMAGED" | "NOT_AVAILABLE";

interface FacilityState {
  condition: FacilityCondition;
  notes: string;
  file: File | null;
  previewUrl: string | null;
}

export function CheckinInspectionModal({
  bookingId,
  propertyName,
  studentName,
  roomUnitNumber,
  isOpen,
  onClose,
  onSuccess,
}: CheckinInspectionModalProps) {
  const [ac, setAc] = useState<FacilityState>({
    condition: "GOOD",
    notes: "",
    file: null,
    previewUrl: null,
  });

  const [bed, setBed] = useState<FacilityState>({
    condition: "GOOD",
    notes: "",
    file: null,
    previewUrl: null,
  });

  const [walls, setWalls] = useState<FacilityState>({
    condition: "GOOD",
    notes: "",
    file: null,
    previewUrl: null,
  });

  const [bathroom, setBathroom] = useState<FacilityState>({
    condition: "GOOD",
    notes: "",
    file: null,
    previewUrl: null,
  });

  const [generalNotes, setGeneralNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (
    setter: React.Dispatch<React.SetStateAction<FacilityState>>,
    file: File | null
  ) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setter((prev) => ({
      ...prev,
      file,
      previewUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      // AC
      formData.append("ac_condition", ac.condition);
      if (ac.notes) formData.append("ac_notes", ac.notes);
      if (ac.file) formData.append("ac_file", ac.file);

      // Bed
      formData.append("bed_condition", bed.condition);
      if (bed.notes) formData.append("bed_notes", bed.notes);
      if (bed.file) formData.append("bed_file", bed.file);

      // Walls
      formData.append("walls_condition", walls.condition);
      if (walls.notes) formData.append("walls_notes", walls.notes);
      if (walls.file) formData.append("walls_file", walls.file);

      // Bathroom
      formData.append("bathroom_condition", bathroom.condition);
      if (bathroom.notes) formData.append("bathroom_notes", bathroom.notes);
      if (bathroom.file) formData.append("bathroom_file", bathroom.file);

      // General Notes
      if (generalNotes) formData.append("general_notes", generalNotes);

      const res = await fetch(`/api/bookings/${bookingId}/inspection`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan berita acara inspeksi.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat mengunggah data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFacilitySection = (
    title: string,
    facility: FacilityState,
    setFacility: React.Dispatch<React.SetStateAction<FacilityState>>,
    inputId: string
  ) => {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setFacility((prev) => ({ ...prev, condition: "GOOD" }))
              }
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                facility.condition === "GOOD"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Baik</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFacility((prev) => ({ ...prev, condition: "DAMAGED" }))
              }
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                facility.condition === "DAMAGED"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cacat Awal</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFacility((prev) => ({ ...prev, condition: "NOT_AVAILABLE" }))
              }
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                facility.condition === "NOT_AVAILABLE"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Tidak Ada</span>
            </button>
          </div>
        </div>

        {facility.condition !== "NOT_AVAILABLE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <input
                type="text"
                placeholder="Catatan kondisi (opsional, misal: dingin normal/ada baret)"
                value={facility.notes}
                onChange={(e) =>
                  setFacility((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor={inputId}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              >
                {facility.previewUrl ? (
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0">
                      <Image
                        src={facility.previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 truncate max-w-[140px]">
                      {facility.file?.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-medium">
                      Foto Bukti Fisik
                    </span>
                  </>
                )}
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) =>
                    handleFileChange(setFacility, e.target.files?.[0] || null)
                  }
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Berita Acara Digital Serah Terima Kamar (BAST)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {propertyName} • Penyewa: {studentName} {roomUnitNumber ? `• Kamar ${roomUnitNumber}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2 shrink-0">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Foto & kondisi fasilitas ini akan <strong>dikunci permanen sebagai baseline</strong> untuk melindungi kedua belah pihak dari sanggahan (dispute) saat pengembalian deposit di akhir sewa.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Facility 1: AC */}
          {renderFacilitySection("1. Kondisi Air Conditioner (AC)", ac, setAc, "ac_file_input")}

          {/* Facility 2: Kasur */}
          {renderFacilitySection("2. Kasur & Springbed", bed, setBed, "bed_file_input")}

          {/* Facility 3: Dinding & Plafon */}
          {renderFacilitySection("3. Dinding, Cat & Plafon", walls, setWalls, "walls_file_input")}

          {/* Facility 4: Kamar Mandi */}
          {renderFacilitySection("4. Kamar Mandi & Sanitasi", bathroom, setBathroom, "bathroom_file_input")}

          {/* General Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white block">
              Catatan Umum & Inventaris Tambahan:
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Contoh: Kunci kamar 1 buah, kunci gerbang 1 buah, meteran listrik awal 1245 kWh."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150 dark:border-slate-800 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah & Mengunci BAST...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Simpan & Kunci Baseline Kamar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
