"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Building2,
  Loader2,
  Search,
  Check,
  X,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import {
  VISIT_TIME_SLOTS,
  VISIT_STATUS_LABELS,
  VisitStatus,
  getTodayWibDateString,
  getMaxVisitWibDateString,
  formatVisitDateId,
} from "@/lib/visit-schedule";

interface VisitItem {
  id: string;
  student_name: string;
  student_whatsapp: string;
  visit_date: string;
  visit_time_slot: string;
  notes: string | null;
  status: VisitStatus | string;
  reschedule_date: string | null;
  reschedule_time_slot: string | null;
  reschedule_note: string | null;
  cancellation_reason: string | null;
  created_at: string;
  property: {
    id: string;
    name: string;
    address: string | null;
  };
}

export default function PartnerVisitsPage() {
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "ACCEPTED" | "RESCHEDULED" | "HISTORY"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal Reschedule / Reject
  const [modalState, setModalState] = useState<{
    visit: VisitItem;
    mode: "RESCHEDULE" | "REJECT";
  } | null>(null);
  const [minDate] = useState(() => getTodayWibDateString());
  const [maxDate] = useState(() => getMaxVisitWibDateString(30));
  const [rescheduleDate, setRescheduleDate] = useState(() => getTodayWibDateString());
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<string>(
    VISIT_TIME_SLOTS[2].value
  );
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/visits?audience=OWNER", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setVisits(data.visits || []);
        } else {
          setErrorMsg(data.error || "Gagal memuat jadwal survei.");
        }
      })
      .catch(() => {
        if (isMounted) setErrorMsg("Terjadi kesalahan jaringan.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAction = async (
    visitId: string,
    action: "ACCEPT" | "REJECT" | "RESCHEDULE" | "COMPLETE",
    extra?: { rescheduleDate?: string; rescheduleTimeSlot?: string; note?: string }
  ) => {
    try {
      setActionLoadingId(visitId);
      setErrorMsg(null);

      const res = await fetch(`/api/partner/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...extra,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal memperbarui jadwal survei.");
        return;
      }

      setVisits((prev) =>
        prev.map((v) =>
          v.id === visitId
            ? {
                ...v,
                status: data.status,
                reschedule_date: data.visit?.reschedule_date ?? v.reschedule_date,
                reschedule_time_slot:
                  data.visit?.reschedule_time_slot ?? v.reschedule_time_slot,
                reschedule_note: data.visit?.reschedule_note ?? v.reschedule_note,
                cancellation_reason:
                  data.visit?.cancellation_reason ?? v.cancellation_reason,
              }
            : v
        )
      );

      setModalState(null);
      setNoteInput("");

      const labelMap: Record<typeof action, string> = {
        ACCEPT: "Jadwal survei disetujui dan calon penyewa telah dikabari via WhatsApp.",
        REJECT: "Jadwal survei telah ditolak.",
        RESCHEDULE: "Usulan jadwal ulang telah dikirim ke calon penyewa.",
        COMPLETE: "Status survei ditandai selesai.",
      };
      setSuccessMsg(labelMap[action]);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredVisits = visits.filter((v) => {
    let matchesFilter = true;
    if (filterStatus === "PENDING") matchesFilter = v.status === "PENDING";
    else if (filterStatus === "ACCEPTED") matchesFilter = v.status === "ACCEPTED";
    else if (filterStatus === "RESCHEDULED") matchesFilter = v.status === "RESCHEDULED";
    else if (filterStatus === "HISTORY") {
      matchesFilter = ["REJECTED", "CANCELLED", "COMPLETED"].includes(v.status);
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      v.student_name.toLowerCase().includes(q) ||
      v.property.name.toLowerCase().includes(q) ||
      v.student_whatsapp.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const label = VISIT_STATUS_LABELS[status as VisitStatus] || status;
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{label}</span>
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{label}</span>
          </span>
        );
      case "RESCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>{label}</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <Check className="w-3.5 h-3.5" />
            <span>{label}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarClock className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Jadwal Survei Lokasi</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Kelola janji temu calon penyewa yang ingin melihat langsung kondisi kamar kos Anda.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "ALL", label: "Semua" },
            { id: "PENDING", label: "Menunggu" },
            { id: "ACCEPTED", label: "Disetujui" },
            { id: "RESCHEDULED", label: "Jadwal Ulang" },
            { id: "HISTORY", label: "Riwayat" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id as typeof filterStatus)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama penyewa atau kos..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium">Memuat daftar jadwal survei...</p>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-2">
          <CalendarClock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Jadwal Survei
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || filterStatus !== "ALL"
              ? "Tidak ditemukan jadwal survei yang sesuai dengan pencarian atau filter Anda."
              : "Saat calon penyewa mengajukan jadwal survei lokasi di halaman kos Anda, daftarnya akan muncul di sini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVisits.map((visit) => {
            const isBusy = actionLoadingId === visit.id;
            return (
              <div
                key={visit.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {getStatusBadge(visit.status)}
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{visit.property.name}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {visit.student_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatVisitDateId(visit.visit_date)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{visit.visit_time_slot} WIB</span>
                      </span>
                      <a
                        href={`https://wa.me/${visit.student_whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{visit.student_whatsapp}</span>
                      </a>
                    </div>
                  </div>

                  {visit.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 inline-flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{visit.notes}</span>
                    </p>
                  )}

                  {visit.status === "RESCHEDULED" && visit.reschedule_date && (
                    <div className="text-xs bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800">
                      <strong>Usulan Baru:</strong> {formatVisitDateId(visit.reschedule_date)} (
                      {visit.reschedule_time_slot} WIB)
                      {visit.reschedule_note ? ` — "${visit.reschedule_note}"` : ""}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {visit.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(visit.id, "ACCEPT")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Terima</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setNoteInput("");
                          setModalState({ visit, mode: "RESCHEDULE" });
                        }}
                        className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Jadwalkan Ulang
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setNoteInput("");
                          setModalState({ visit, mode: "REJECT" });
                        }}
                        className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Tolak
                      </button>
                    </>
                  )}

                  {(visit.status === "ACCEPTED" || visit.status === "RESCHEDULED") && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAction(visit.id, "COMPLETE")}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai Selesai Survei</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Reschedule / Reject */}
      {modalState && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalState(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-visit-modal-title"
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-float space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                id="partner-visit-modal-title"
                className="text-base font-extrabold text-slate-900 dark:text-white"
              >
                {modalState.mode === "RESCHEDULE"
                  ? "Usulkan Jadwal Survei Ulang"
                  : "Tolak Jadwal Survei"}
              </h2>
              <button
                type="button"
                onClick={() => setModalState(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalState.mode === "RESCHEDULE" && (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="partner-reschedule-date"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Tanggal Usulan Baru
                  </label>
                  <input
                    id="partner-reschedule-date"
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label
                    htmlFor="partner-reschedule-slot"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Sesi Jam Baru (WIB)
                  </label>
                  <select
                    id="partner-reschedule-slot"
                    value={rescheduleTimeSlot}
                    onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {VISIT_TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="partner-visit-note"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {modalState.mode === "RESCHEDULE"
                  ? "Catatan Tambahan (Opsional)"
                  : "Alasan Penolakan (Opsional)"}
              </label>
              <textarea
                id="partner-visit-note"
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={
                  modalState.mode === "RESCHEDULE"
                    ? "Contoh: Penjaga baru ada di lokasi mulai pukul 15:00 WIB."
                    : "Contoh: Kamar sedang dalam proses pemeliharaan."
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalState(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoadingId === modalState.visit.id}
                onClick={() =>
                  handleAction(modalState.visit.id, modalState.mode, {
                    rescheduleDate:
                      modalState.mode === "RESCHEDULE" ? rescheduleDate : undefined,
                    rescheduleTimeSlot:
                      modalState.mode === "RESCHEDULE" ? rescheduleTimeSlot : undefined,
                    note: noteInput.trim() || undefined,
                  })
                }
                className={`w-1/2 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer ${
                  modalState.mode === "RESCHEDULE"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {modalState.mode === "RESCHEDULE" ? "Kirim Jadwal Baru" : "Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
