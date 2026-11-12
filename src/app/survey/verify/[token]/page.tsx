"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  CalendarClock,
  User,
  Home,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Phone,
  ArrowRight,
  AlertCircle,
  X,
  MessageSquare,
  MapPin,
} from "lucide-react";
import {
  VISIT_TIME_SLOTS,
  getTodayWibDateString,
  getMaxVisitWibDateString,
  formatVisitDateId,
} from "@/lib/visit-schedule";

interface VisitDetail {
  id: string;
  studentName: string;
  studentWhatsapp: string;
  visitDate: string;
  visitTimeSlot: string;
  notes: string | null;
  status: string;
  createdAt: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string | null;
  genderType: string;
  availableRooms: number;
  userBio: string | null;
}

interface ValidationData {
  token: string;
  ownerName: string;
  visit: VisitDetail;
}

export default function SurveyVerifyPage() {
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ValidationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isAlreadyUsed, setIsAlreadyUsed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionResult, setDecisionResult] = useState<
    "ACCEPTED" | "REJECTED" | "RESCHEDULED" | null
  >(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Panel Mode: DEFAULT | REJECT | RESCHEDULE
  const [activeActionPanel, setActiveActionPanel] = useState<
    "DEFAULT" | "REJECT" | "RESCHEDULE"
  >("DEFAULT");

  const [minDate] = useState(() => getTodayWibDateString());
  const [maxDate] = useState(() => getMaxVisitWibDateString(30));
  const [rescheduleDate, setRescheduleDate] = useState(() => getTodayWibDateString());
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<string>(
    VISIT_TIME_SLOTS[2].value
  );
  const [actionNote, setActionNote] = useState("");

  useEffect(() => {
    if (!token) return;

    async function validateToken() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `/api/magic-link/visit/validate?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Tautan verifikasi survei tidak valid.");
          if (json.isExpired) setIsExpired(true);
          if (json.isUsed) setIsAlreadyUsed(true);
          return;
        }

        setData(json.data);
      } catch {
        setError("Gagal menghubungi server. Pastikan koneksi internet Anda stabil.");
      } finally {
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleDecision = async (action: "ACCEPT" | "REJECT" | "RESCHEDULE") => {
    if (!token || isSubmitting) return;

    if (action === "RESCHEDULE") {
      if (!rescheduleDate || rescheduleDate < minDate) {
        setDecisionError("Pilih tanggal jadwal ulang minimal hari ini.");
        return;
      }
      if (!rescheduleTimeSlot.trim()) {
        setDecisionError("Pilih sesi jam untuk jadwal ulang.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setDecisionError(null);

      const res = await fetch("/api/magic-link/visit/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action,
          rescheduleDate: action === "RESCHEDULE" ? rescheduleDate : undefined,
          rescheduleTimeSlot: action === "RESCHEDULE" ? rescheduleTimeSlot : undefined,
          note: actionNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setDecisionError(json.error || "Gagal memproses keputusan survei.");
        return;
      }

      setDecisionResult(
        action === "ACCEPT"
          ? "ACCEPTED"
          : action === "RESCHEDULE"
          ? "RESCHEDULED"
          : "REJECTED"
      );
    } catch {
      setDecisionError("Terjadi kesalahan jaringan saat mengirim keputusan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 antialiased font-sans">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-soft">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
              KP
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              KosPasti
            </span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Konfirmasi Survei</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 my-auto flex flex-col justify-center">
        {isLoading && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-soft flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <div>
              <h1 className="text-base font-extrabold text-slate-900">
                Memuat Detail Janji Survei...
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Mohon tunggu sebentar selagi kami memverifikasi tautan Anda.
              </p>
            </div>
          </div>
        )}

        {!isLoading && error && !decisionResult && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-soft text-center space-y-5">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100">
              {isExpired ? (
                <Clock className="w-8 h-8" />
              ) : isAlreadyUsed ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {isAlreadyUsed
                  ? "Tautan Sudah Diproses"
                  : isExpired
                  ? "Tautan Telah Kedaluwarsa"
                  : "Tautan Tidak Valid"}
              </h1>
              <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">
                {error}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href="/partner/dashboard/visits"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95"
              >
                <span>Buka Dashboard Survei</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all"
              >
                <span>Ke Beranda</span>
              </Link>
            </div>
          </div>
        )}

        {!isLoading && decisionResult && (
          <div
            role="status"
            aria-live="polite"
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-float text-center space-y-5"
          >
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center border ${
                decisionResult === "ACCEPTED"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : decisionResult === "RESCHEDULED"
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-rose-50 text-rose-600 border-rose-200"
              }`}
            >
              {decisionResult === "ACCEPTED" ? (
                <CheckCircle2 className="w-9 h-9" />
              ) : decisionResult === "RESCHEDULED" ? (
                <CalendarClock className="w-9 h-9" />
              ) : (
                <XCircle className="w-9 h-9" />
              )}
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {decisionResult === "ACCEPTED"
                  ? "Jadwal Survei Disetujui"
                  : decisionResult === "RESCHEDULED"
                  ? "Usulan Jadwal Ulang Terkirim"
                  : "Jadwal Survei Ditolak"}
              </h1>
              <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">
                {decisionResult === "ACCEPTED"
                  ? "Pesan konfirmasi beserta alamat kos sudah dikirim otomatis ke WhatsApp dan akun calon penyewa."
                  : decisionResult === "RESCHEDULED"
                  ? "Calon penyewa telah dikabari mengenai waktu survei alternatif yang Anda usulkan."
                  : "Pemberitahuan pembatalan jadwal survei telah disampaikan kepada calon penyewa."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Properti Kos</span>
                <span className="font-bold text-slate-900">{data?.visit.propertyName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Calon Penyewa</span>
                <span className="font-bold text-slate-900">{data?.visit.studentName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Jadwal Disepakati</span>
                <span className="font-bold text-emerald-700 text-right">
                  {decisionResult === "RESCHEDULED"
                    ? `${formatVisitDateId(rescheduleDate)} (${rescheduleTimeSlot})`
                    : data
                    ? `${formatVisitDateId(data.visit.visitDate)} (${data.visit.visitTimeSlot})`
                    : "-"}
                </span>
              </div>
            </div>

            <Link
              href="/partner/dashboard/visits"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all active:scale-95"
            >
              <span>Lihat Semua Jadwal di Portal Mitra</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!isLoading && data && !decisionResult && (
          <div className="space-y-4">
            {/* Greeting Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Permintaan Survei Lokasi
                  </p>
                  <h1 className="text-lg font-extrabold text-slate-900 mt-0.5 tracking-tight">
                    Halo, Bapak/Ibu {data.ownerName}
                  </h1>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Menunggu</span>
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">
                Ada calon penyewa yang ingin melihat langsung kondisi kamar sebelum melakukan
                pembayaran sewa.
              </p>
            </div>

            {/* Detail Calon Penyewa & Jadwal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Identitas Pengunjung</span>
                </h2>
                <span className="text-[11px] font-medium text-slate-400">
                  #{data.visit.id.slice(0, 8)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-base font-extrabold text-slate-900">
                    {data.visit.studentName}
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {data.visit.userBio || "Calon penyewa dari KosPasti"}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${data.visit.studentWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors shrink-0 self-start"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{data.visit.studentWhatsapp}</span>
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Jadwal Kunjungan Diajukan
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {formatVisitDateId(data.visit.visitDate)}
                  </p>
                  <p className="text-xs font-bold text-emerald-700">
                    Pukul {data.visit.visitTimeSlot} WIB
                  </p>
                </div>
              </div>

              {data.visit.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5 text-xs">
                  <MessageSquare className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-700">Catatan Pengunjung</p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{data.visit.notes}</p>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs">
                <Home className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{data.visit.propertyName}</p>
                  {data.visit.propertyAddress && (
                    <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{data.visit.propertyAddress}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft space-y-4">
              {decisionError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{decisionError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDecisionError(null)}
                    aria-label="Tutup pesan error"
                    className="p-0.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {activeActionPanel === "DEFAULT" && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700 text-center">
                    Pilih konfirmasi ketersediaan Anda untuk menemui calon penyewa:
                  </p>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDecision("ACCEPT")}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Terima Jadwal Survei</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setDecisionError(null);
                        setActiveActionPanel("RESCHEDULE");
                      }}
                      className="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-800 font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CalendarClock className="w-4 h-4" />
                      <span>Jadwalkan Ulang</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setDecisionError(null);
                        setActiveActionPanel("REJECT");
                      }}
                      className="py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              )}

              {activeActionPanel === "RESCHEDULE" && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Usulkan Waktu Alternatif
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveActionPanel("DEFAULT")}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Kembali
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="reschedule-date"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Tanggal Baru
                    </label>
                    <input
                      id="reschedule-date"
                      type="date"
                      min={minDate}
                      max={maxDate}
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reschedule-slot"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Sesi Jam Baru (WIB)
                    </label>
                    <select
                      id="reschedule-slot"
                      value={rescheduleTimeSlot}
                      onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    >
                      {VISIT_TIME_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="reschedule-note"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Catatan untuk Calon Penyewa (Opsional)
                    </label>
                    <textarea
                      id="reschedule-note"
                      rows={2}
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Contoh: Jam tersebut saya masih keluar, bisanya setelah jam 3 sore."
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDecision("RESCHEDULE")}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CalendarClock className="w-4 h-4" />
                        <span>Kirim Usulan Jadwal Baru</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeActionPanel === "REJECT" && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-rose-700">
                      Konfirmasi Penolakan Survei
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveActionPanel("DEFAULT")}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Kembali
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="reject-note"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Alasan Penolakan (Opsional)
                    </label>
                    <textarea
                      id="reject-note"
                      rows={3}
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Contoh: Semua kamar saat ini sudah penuh terisi atau sedang tahap renovasi."
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDecision("REJECT")}
                    className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Ya, Tolak Permintaan Survei</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        <p>© {new Date().getFullYear()} KosPasti. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}

