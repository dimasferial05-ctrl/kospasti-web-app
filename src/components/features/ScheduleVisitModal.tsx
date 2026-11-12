"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  VISIT_TIME_SLOTS,
  VISIT_STATUS_LABELS,
  type VisitStatus,
  getTodayWibDateString,
  getMaxVisitWibDateString,
  isValidIndonesianWhatsApp,
  formatVisitDateId,
} from "@/lib/visit-schedule";

export interface ExistingVisitSummary {
  id: string;
  status: string;
  visit_date: string;
  visit_time_slot: string;
  reschedule_date?: string | null;
  reschedule_time_slot?: string | null;
}

const VISIT_STORAGE_KEY = "kospasti_scheduled_visits";

export function getLocalScheduledVisit(propertyId: string): ExistingVisitSummary | null {
  if (typeof window === "undefined" || !propertyId) return null;
  try {
    const raw = window.localStorage.getItem(VISIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, ExistingVisitSummary>;
    const match = parsed?.[propertyId];
    if (!match || !match.id || match.status === "CANCELLED") return null;
    return match;
  } catch {
    return null;
  }
}

export function saveLocalScheduledVisit(
  propertyId: string,
  visit: ExistingVisitSummary
): void {
  if (typeof window === "undefined" || !propertyId) return;
  try {
    const raw = window.localStorage.getItem(VISIT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, ExistingVisitSummary>) : {};
    parsed[propertyId] = visit;
    window.localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Abaikan jika localStorage tidak tersedia
  }
}

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  propertyAddress?: string | null;
  existingVisit?: ExistingVisitSummary | null;
  onVisitCreated?: (visit: ExistingVisitSummary) => void;
}

export function ScheduleVisitModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  propertyAddress,
  existingVisit = null,
  onVisitCreated,
}: ScheduleVisitModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [minDate] = useState(() => getTodayWibDateString());
  const [maxDate] = useState(() => getMaxVisitWibDateString(30));

  const [studentName, setStudentName] = useState("");
  const [studentWhatsapp, setStudentWhatsapp] = useState("");
  const [visitDate, setVisitDate] = useState(() => getTodayWibDateString());
  const [visitTimeSlot, setVisitTimeSlot] = useState<string>(VISIT_TIME_SLOTS[2].value);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    whatsapp?: string;
    date?: string;
  }>({});

  const [successData, setSuccessData] = useState<{
    visitDateFormatted: string;
    visitTimeSlot: string;
  } | null>(null);
  const [localExistingVisit, setLocalExistingVisit] =
    useState<ExistingVisitSummary | null>(null);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  const effectiveExistingVisit = localExistingVisit ?? existingVisit;

  const handleClose = () => {
    setErrorMsg(null);
    setFieldErrors({});
    setSuccessData(null);
    onClose();
  };

  // Sinkronkan dialog native dengan prop isOpen
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }

      // Prefill otomatis & cek apakah user sudah punya jadwal survei di kos ini
      let active = true;
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!active || !data?.authenticated || !data.user) return;
          setIsAuthenticatedUser(true);
          if (data.user.name) {
            setStudentName((prev) => prev || data.user.name);
          }
          if (data.user.whatsapp) {
            setStudentWhatsapp((prev) => prev || data.user.whatsapp);
          }
        })
        .catch(() => {
          // Guest visitor tetap dapat mengisi form manual
        });

      if (propertyId) {
        fetch(`/api/visits?propertyId=${encodeURIComponent(propertyId)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (!active) return;
            if (data?.existingVisit) {
              setLocalExistingVisit(data.existingVisit);
              saveLocalScheduledVisit(propertyId, data.existingVisit);
            } else {
              const cached = getLocalScheduledVisit(propertyId);
              if (cached) setLocalExistingVisit(cached);
            }
          })
          .catch(() => {
            if (!active) return;
            const cached = getLocalScheduledVisit(propertyId);
            if (cached) setLocalExistingVisit(cached);
          });
      }

      return () => {
        active = false;
      };
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, propertyId]);

  // Fallback light-dismiss jika browser belum mendukung dialog[closedby="any"] (Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    if (typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype) {
      return;
    }

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const rect = dialog.getBoundingClientRect();
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
    };

    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        onClose();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", handlePointerDown);
    dialog.addEventListener("pointerup", handlePointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isOpen, onClose]);

  const validateField = (field: "name" | "whatsapp" | "date", value: string) => {
    if (field === "name") {
      if (value.trim().length < 2) {
        setFieldErrors((prev) => ({ ...prev, name: "Nama minimal 2 karakter." }));
        return false;
      }
      setFieldErrors((prev) => ({ ...prev, name: undefined }));
      return true;
    }

    if (field === "whatsapp") {
      if (!isValidIndonesianWhatsApp(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          whatsapp: "Gunakan nomor WhatsApp valid diawali 08 atau 628.",
        }));
        return false;
      }
      setFieldErrors((prev) => ({ ...prev, whatsapp: undefined }));
      return true;
    }

    if (field === "date") {
      if (!value || value < minDate) {
        setFieldErrors((prev) => ({
          ...prev,
          date: "Tanggal survei tidak boleh lebih awal dari hari ini.",
        }));
        return false;
      }
      setFieldErrors((prev) => ({ ...prev, date: undefined }));
      return true;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const isNameOk = validateField("name", studentName);
    const isWaOk = validateField("whatsapp", studentWhatsapp);
    const isDateOk = validateField("date", visitDate);

    if (!isNameOk || !isWaOk || !isDateOk) {
      setErrorMsg("Mohon periksa kembali data yang masih perlu dilengkapi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          studentName: studentName.trim(),
          studentWhatsapp: studentWhatsapp.trim(),
          visitDate,
          visitTimeSlot,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        if (res.status === 409 && json?.existingVisit) {
          saveLocalScheduledVisit(propertyId, json.existingVisit);
          setLocalExistingVisit(json.existingVisit);
          onVisitCreated?.(json.existingVisit);
        }
        setErrorMsg(
          json?.error || "Gagal mengirim permintaan survei. Silakan coba lagi."
        );
        return;
      }

      const createdSummary: ExistingVisitSummary = {
        id: json.data?.visitId || `visit-${Date.now()}`,
        status: json.data?.status || "PENDING",
        visit_date: String(json.data?.visitDate || visitDate),
        visit_time_slot: json.data?.visitTimeSlot || visitTimeSlot,
      };
      saveLocalScheduledVisit(propertyId, createdSummary);
      setLocalExistingVisit(createdSummary);
      onVisitCreated?.(createdSummary);

      setSuccessData({
        visitDateFormatted: formatVisitDateId(visitDate),
        visitTimeSlot,
      });
    } catch {
      setErrorMsg("Terjadi kesalahan koneksi saat mengirim jadwal survei.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="schedule-visit-title"
      aria-describedby="schedule-visit-desc"
      onClose={handleClose}
      className="m-auto w-[calc(100%-1.5rem)] max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 text-slate-900 dark:text-slate-100 shadow-float backdrop:bg-slate-900/60"
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="schedule-visit-title"
                className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight"
              >
                Jadwalkan Survei Lokasi
              </h2>
              <p
                id="schedule-visit-desc"
                className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5"
              >
                Buat janji bertemu pemilik sebelum melakukan pemesanan kamar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup modal jadwal survei"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successData ? (
          <div
            role="status"
            aria-live="polite"
            className="py-5 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Permintaan Survei Terkirim
              </h3>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                Notifikasi WhatsApp telah dikirim ke pengelola{" "}
                <strong className="text-slate-900 dark:text-white">{propertyName}</strong>. Anda
                akan segera mendapat konfirmasi melalui WhatsApp dan lonceng notifikasi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 text-left text-xs space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Tanggal Survei</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">
                  {successData.visitDateFormatted}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Perkiraan Jam</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {successData.visitTimeSlot} WIB
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-soft transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              Selesai
            </button>
          </div>
        ) : effectiveExistingVisit ? (
          <div className="mt-4 space-y-4">
            {errorMsg && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Jadwal Survei Sudah Terdaftar
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                    Anda sudah membuat 1 jadwal survei untuk{" "}
                    <strong className="text-slate-900 dark:text-white">{propertyName}</strong>.
                    Untuk mencegah spam, setiap calon penyewa hanya dapat mengajukan 1 jadwal survei per kos.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {VISIT_STATUS_LABELS[effectiveExistingVisit.status as VisitStatus] ||
                      effectiveExistingVisit.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Tanggal Survei</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">
                    {formatVisitDateId(
                      effectiveExistingVisit.reschedule_date ||
                        effectiveExistingVisit.visit_date
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Perkiraan Jam</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {effectiveExistingVisit.reschedule_time_slot ||
                      effectiveExistingVisit.visit_time_slot}{" "}
                    WIB
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
              >
                Tutup
              </button>
              {isAuthenticatedUser && (
                <Link
                  href="/profil?tab=visits"
                  onClick={handleClose}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Lihat di Profil</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            {/* Ringkasan Properti */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {propertyName}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                  {propertyAddress || "Alamat lengkap diberikan setelah konfirmasi"}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  aria-label="Tutup pesan error"
                  className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Tanggal Survei */}
            <div>
              <label
                htmlFor="visit-date-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Tanggal Kunjungan <span aria-hidden="true" className="text-rose-500">*</span>
                </span>
              </label>
              <input
                ref={firstInputRef}
                id="visit-date-input"
                name="visitDate"
                type="date"
                min={minDate}
                max={maxDate}
                value={visitDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setVisitDate(val);
                  if (fieldErrors.date) validateField("date", val);
                  if (errorMsg) setErrorMsg(null);
                }}
                onBlur={(e) => validateField("date", e.target.value)}
                aria-invalid={Boolean(fieldErrors.date)}
                aria-describedby={fieldErrors.date ? "visit-date-err" : "visit-date-hint"}
                required
                className={`w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.date
                    ? "border-rose-500 focus:ring-rose-500/40"
                    : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500"
                }`}
              />
              {fieldErrors.date ? (
                <p id="visit-date-err" className="text-[11px] font-medium text-rose-600 mt-1">
                  {fieldErrors.date}
                </p>
              ) : (
                <p id="visit-date-hint" className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Pilih tanggal hari ini hingga 30 hari ke depan.
                </p>
              )}
            </div>

            {/* Sesi Jam Kunjungan (5 opsi -> radio buttons dalam fieldset) */}
            <fieldset>
              <legend className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Perkiraan Jam Kunjungan (WIB){" "}
                  <span aria-hidden="true" className="text-rose-500">*</span>
                </span>
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VISIT_TIME_SLOTS.map((slot) => {
                  const isChecked = visitTimeSlot === slot.value;
                  const inputId = `slot-${slot.value.replace(/\s+/g, "")}`;
                  return (
                    <label
                      key={slot.value}
                      htmlFor={inputId}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isChecked
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/40"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name="visitTimeSlot"
                        value={slot.value}
                        checked={isChecked}
                        onChange={(e) => setVisitTimeSlot(e.target.value)}
                        className="accent-emerald-600 shrink-0"
                      />
                      <span className="truncate">{slot.value}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Nama & Nomor WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="visit-name-input"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Nama Lengkap <span aria-hidden="true" className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  id="visit-name-input"
                  name="studentName"
                  type="text"
                  autoComplete="name"
                  placeholder="Nama Lengkap Anda"
                  value={studentName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudentName(val);
                    if (fieldErrors.name) validateField("name", val);
                  }}
                  onBlur={(e) => validateField("name", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "visit-name-err" : undefined}
                  required
                  className={`w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.name
                      ? "border-rose-500 focus:ring-rose-500/40"
                      : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500"
                  }`}
                />
                {fieldErrors.name && (
                  <p id="visit-name-err" className="text-[11px] font-medium text-rose-600 mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="visit-wa-input"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    No. WhatsApp <span aria-hidden="true" className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  id="visit-wa-input"
                  name="studentWhatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="0812xxxxxxxx"
                  value={studentWhatsapp}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudentWhatsapp(val);
                    if (fieldErrors.whatsapp) validateField("whatsapp", val);
                  }}
                  onBlur={(e) => validateField("whatsapp", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.whatsapp)}
                  aria-describedby={fieldErrors.whatsapp ? "visit-wa-err" : undefined}
                  required
                  className={`w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.whatsapp
                      ? "border-rose-500 focus:ring-rose-500/40"
                      : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500"
                  }`}
                />
                {fieldErrors.whatsapp && (
                  <p id="visit-wa-err" className="text-[11px] font-medium text-rose-600 mt-1">
                    {fieldErrors.whatsapp}
                  </p>
                )}
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label
                htmlFor="visit-notes-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Catatan Tambahan (Opsional)</span>
              </label>
              <textarea
                id="visit-notes-input"
                name="notes"
                rows={2}
                maxLength={500}
                placeholder="Contoh: Datang bersama orang tua, ingin melihat kamar lantai 2."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-1/3 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-2/3 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-soft hover:shadow-float transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Jadwal...</span>
                  </>
                ) : (
                  <>
                    <CalendarClock className="w-4 h-4" />
                    <span>Kirim Permintaan Survei</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
