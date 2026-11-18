"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import {
  VISIT_STATUS_LABELS,
  VISIT_TIME_SLOTS,
  MAX_STUDENT_VISIT_RESCHEDULES,
  canStudentRescheduleVisit,
  getTodayWibDateString,
  getMaxVisitWibDateString,
  VisitStatus,
  formatVisitDateId,
} from "@/lib/visit-schedule";
import { saveLocalScheduledVisit } from "@/components/features/ScheduleVisitModal";
import { VisitScheduleItem } from "@/types/profile";

export interface VisitsTabProps {
  visits: VisitScheduleItem[];
  isLoadingVisits: boolean;
  onVisitsUpdated?: () => void;
}

export function VisitsTab({ visits, isLoadingVisits, onVisitsUpdated }: VisitsTabProps) {
  const visitRescheduleDialogRef = useRef<HTMLDialogElement>(null);
  const [visitMinDate] = useState(() => getTodayWibDateString());
  const [visitMaxDate] = useState(() => getMaxVisitWibDateString(30));
  const [reschedulingVisit, setReschedulingVisit] = useState<VisitScheduleItem | null>(null);
  const [visitRescheduleDate, setVisitRescheduleDate] = useState("");
  const [visitRescheduleSlot, setVisitRescheduleSlot] = useState<string>(
    VISIT_TIME_SLOTS[2].value
  );
  const [visitRescheduleNote, setVisitRescheduleNote] = useState("");
  const [isSubmittingVisitReschedule, setIsSubmittingVisitReschedule] = useState(false);
  const [visitRescheduleError, setVisitRescheduleError] = useState<string | null>(null);
  const [visitRescheduleSuccess, setVisitRescheduleSuccess] = useState<string | null>(null);

  const openStudentRescheduleModal = (visit: VisitScheduleItem) => {
    const rawCurrentDate = visit.reschedule_date || visit.visit_date;
    const formattedYmd = rawCurrentDate
      ? getTodayWibDateString(new Date(rawCurrentDate))
      : visitMinDate;
    setVisitRescheduleDate(formattedYmd >= visitMinDate ? formattedYmd : visitMinDate);
    setVisitRescheduleSlot(
      visit.reschedule_time_slot || visit.visit_time_slot || VISIT_TIME_SLOTS[2].value
    );
    setVisitRescheduleNote(visit.notes || "");
    setVisitRescheduleError(null);
    setVisitRescheduleSuccess(null);
    setReschedulingVisit(visit);
  };

  useEffect(() => {
    const dialog = visitRescheduleDialogRef.current;
    if (!dialog) return;
    if (reschedulingVisit) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [reschedulingVisit]);

  const handleSubmitStudentReschedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reschedulingVisit || isSubmittingVisitReschedule) return;

    if (!visitRescheduleDate || visitRescheduleDate < visitMinDate) {
      setVisitRescheduleError("Tanggal survei baru tidak boleh lebih awal dari hari ini.");
      return;
    }

    try {
      setIsSubmittingVisitReschedule(true);
      setVisitRescheduleError(null);

      const res = await fetch(`/api/user/visits/${reschedulingVisit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitDate: visitRescheduleDate,
          visitTimeSlot: visitRescheduleSlot,
          notes: visitRescheduleNote.trim(),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setVisitRescheduleError(
          json?.error || "Gagal mengirim perubahan jadwal survei."
        );
        return;
      }

      if (json.visit) {
        saveLocalScheduledVisit(reschedulingVisit.property.id, {
          id: json.visit.id,
          status: json.visit.status,
          visit_date: json.visit.visit_date,
          visit_time_slot: json.visit.visit_time_slot,
        });
      }

      setVisitRescheduleSuccess(
        json.message ||
          "Permintaan perubahan jadwal survei berhasil dikirim ke pemilik kos."
      );
      setReschedulingVisit(null);
      if (onVisitsUpdated) {
        onVisitsUpdated();
      }
    } catch {
      setVisitRescheduleError("Terjadi kesalahan koneksi saat menyimpan jadwal baru.");
    } finally {
      setIsSubmittingVisitReschedule(false);
    }
  };

  return (
    <div>
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Jadwal Survei Lokasi Kos
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Pantau status persetujuan survei lokasi dari pemilik kos sebelum melakukan booking.
        </p>
      </div>

      {visitRescheduleSuccess && (
        <div
          role="status"
          className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{visitRescheduleSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setVisitRescheduleSuccess(null)}
            aria-label="Tutup notifikasi sukses ubah jadwal"
            className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoadingVisits ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
          <p className="text-sm">Memuat jadwal survei...</p>
        </div>
      ) : visits.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarClock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Jadwal Survei
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Anda dapat menjadwalkan survei langsung dari halaman detail kos pilihan Anda.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
          >
            <span>Cari Kos Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => {
            const statusLabel =
              VISIT_STATUS_LABELS[visit.status as VisitStatus] || visit.status;
            return (
              <div
                key={visit.id}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900/60 flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      href={`/kos/${visit.property.id}`}
                      className="font-bold text-slate-900 dark:text-white text-base hover:text-emerald-600 transition-colors"
                    >
                      {visit.property.name}
                    </Link>
                    {visit.property.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{visit.property.address}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{formatVisitDateId(visit.visit_date)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{visit.visit_time_slot} WIB</span>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start border ${
                      visit.status === "ACCEPTED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        : visit.status === "RESCHEDULED"
                        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                        : visit.status === "REJECTED" || visit.status === "CANCELLED"
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {visit.status === "RESCHEDULED" && visit.reschedule_date && (
                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200">
                    <p className="font-bold">Usulan Jadwal Baru dari Pemilik:</p>
                    <p className="mt-0.5">
                      {formatVisitDateId(visit.reschedule_date)} ({visit.reschedule_time_slot} WIB)
                    </p>
                    {visit.reschedule_note && (
                      <p className="mt-1 italic">&quot;{visit.reschedule_note}&quot;</p>
                    )}
                  </div>
                )}

                {visit.status === "REJECTED" && visit.cancellation_reason && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
                    <strong>Catatan Pemilik:</strong> {visit.cancellation_reason}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {(visit.student_reschedule_count ?? 0) >= MAX_STUDENT_VISIT_RESCHEDULES &&
                      ["PENDING", "ACCEPTED", "RESCHEDULED"].includes(visit.status) && (
                        <span>Kuota ubah jadwal (1x) sudah digunakan</span>
                      )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {canStudentRescheduleVisit(
                      visit.status,
                      visit.student_reschedule_count ?? 0
                    ) && (
                      <button
                        type="button"
                        onClick={() => openStudentRescheduleModal(visit)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                      >
                        <CalendarClock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Ubah Jadwal</span>
                      </button>
                    )}
                    {visit.property.owner?.whatsapp_number && (
                      <a
                        href={`https://wa.me/${visit.property.owner.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chat Pemilik</span>
                      </a>
                    )}
                    <Link
                      href={`/kos/${visit.property.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      <span>Lihat Kos / Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ubah Jadwal Survei */}
      <dialog
        ref={visitRescheduleDialogRef}
        closedby="any"
        aria-labelledby="student-visit-reschedule-title"
        onClose={() => {
          setReschedulingVisit(null);
          setVisitRescheduleError(null);
        }}
        className="m-auto w-[calc(100%-1.5rem)] max-w-md rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 text-slate-900 dark:text-slate-100 shadow-float backdrop:bg-slate-900/60"
      >
        {reschedulingVisit && (
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="student-visit-reschedule-title"
                    className="text-base font-extrabold text-slate-900 dark:text-white"
                  >
                    Ubah Jadwal Survei
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {reschedulingVisit.property.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReschedulingVisit(null)}
                aria-label="Tutup modal ubah jadwal survei"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStudentReschedule} className="mt-4 space-y-4">
              <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
                Perubahan jadwal hanya dapat dilakukan 1x dan akan dikirim ulang ke pemilik kos untuk dikonfirmasi.
              </p>

              {visitRescheduleError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{visitRescheduleError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="student-reschedule-date"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Tanggal Kunjungan Baru
                </label>
                <input
                  id="student-reschedule-date"
                  name="visitDate"
                  type="date"
                  min={visitMinDate}
                  max={visitMaxDate}
                  value={visitRescheduleDate}
                  onChange={(e) => {
                    setVisitRescheduleDate(e.target.value);
                    if (visitRescheduleError) setVisitRescheduleError(null);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <fieldset>
                <legend className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Perkiraan Jam Kunjungan (WIB)
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {VISIT_TIME_SLOTS.map((slot) => {
                    const checked = visitRescheduleSlot === slot.value;
                    const radioId = `resched-slot-${slot.value.replace(/\s+/g, "")}`;
                    return (
                      <label
                        key={slot.value}
                        htmlFor={radioId}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          checked
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-200"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <input
                          id={radioId}
                          type="radio"
                          name="visitTimeSlot"
                          value={slot.value}
                          checked={checked}
                          onChange={(e) => setVisitRescheduleSlot(e.target.value)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{slot.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="student-reschedule-note"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  id="student-reschedule-note"
                  name="notes"
                  rows={2}
                  maxLength={250}
                  placeholder="Misal: Mohon maaf ada ujian dadakan..."
                  value={visitRescheduleNote}
                  onChange={(e) => setVisitRescheduleNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingVisit(null)}
                  disabled={isSubmittingVisitReschedule}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVisitReschedule}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingVisitReschedule ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span>Ajukan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}
