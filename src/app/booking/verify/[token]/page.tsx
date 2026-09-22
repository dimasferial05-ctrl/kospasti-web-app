"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Home,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Phone,
  ArrowRight,
  HelpCircle,
  BedDouble,
  BadgeCheck,
} from "lucide-react";

interface BookingDetail {
  id: string;
  studentName: string;
  studentWhatsapp: string;
  moveInDate: string;
  status: string;
  createdAt: string;
  propertyName: string;
  propertyAddress: string | null;
  propertyImage: string | null;
  genderType: string;
  roomTypeName: string | null;
  pricePerMonth: number;
  userAvatar: string | null;
  userBio: string | null;
  userEmail: string | null;
}

interface ValidationData {
  token: string;
  ownerName: string;
  booking: BookingDetail;
}

export default function BookingVerifyPage() {
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ValidationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isAlreadyUsed, setIsAlreadyUsed] = useState(false);

  // Decision State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionResult, setDecisionResult] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!token) return;

    async function validateToken() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/magic-link/booking/validate?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Tautan verifikasi tidak valid.");
          if (json.isExpired) setIsExpired(true);
          if (json.isUsed) setIsAlreadyUsed(true);
          return;
        }

        setData(json.data);
      } catch (err) {
        console.error("Gagal memvalidasi token booking:", err);
        setError("Gagal menghubungi server. Pastikan koneksi internet Anda stabil.");
      } finally {
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleDecision = async (action: "ACCEPT" | "REJECT", customReason?: string) => {
    if (!token || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/magic-link/booking/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          action,
          reason: customReason || rejectReason || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.error || "Gagal memproses keputusan.");
        setIsSubmitting(false);
        return;
      }

      setDecisionResult(action === "ACCEPT" ? "ACCEPTED" : "REJECTED");
      setShowRejectModal(false);
    } catch (err) {
      console.error("Gagal mengirim keputusan:", err);
      alert("Terjadi kesalahan jaringan saat memproses keputusan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 flex flex-col justify-between text-slate-900 antialiased font-sans">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
              KP
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              KosPasti
            </span>
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verifikasi Resmi</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 my-auto flex flex-col justify-center">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <div>
              <h2 className="text-base font-bold text-slate-800">Memeriksa Tautan Verifikasi...</h2>
              <p className="text-xs text-slate-500 mt-1">Mohon tunggu sebentar selagi kami memuat data pesanan.</p>
            </div>
          </div>
        )}

        {/* Error / Expired / Used State */}
        {!isLoading && error && !decisionResult && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md text-center space-y-5">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100">
              {isExpired ? <Clock className="w-8 h-8" /> : isAlreadyUsed ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <AlertTriangle className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isAlreadyUsed
                  ? "Tautan Sudah Digunakan"
                  : isExpired
                  ? "Tautan Telah Kedaluwarsa"
                  : "Tautan Tidak Valid"}
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{error}</p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition shadow-xs"
              >
                <span>Kembali ke Beranda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Decision Done Result Screen */}
        {!isLoading && decisionResult && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-lg text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-inner ${
                decisionResult === "ACCEPTED"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              {decisionResult === "ACCEPTED" ? (
                <CheckCircle2 className="w-9 h-9" />
              ) : (
                <XCircle className="w-9 h-9" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {decisionResult === "ACCEPTED" ? "Pesanan Berhasil Diterima!" : "Pesanan Telah Ditolak"}
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {decisionResult === "ACCEPTED"
                  ? "Notifikasi WhatsApp otomatis telah dikirimkan kepada calon penghuni untuk mengabarkan bahwa pesanan mereka telah Anda konfirmasi."
                  : "Pesanan telah dibatalkan dan 1 unit kamar telah otomatis dikembalikan ke kuota ketersediaan. Calon penghuni telah diberitahu mengenai pembatalan ini."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-left text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Kos:</span>
                <span className="font-semibold text-slate-800">{data?.booking.propertyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pemesan:</span>
                <span className="font-semibold text-slate-800">{data?.booking.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Terbaru:</span>
                <span
                  className={`font-bold ${
                    decisionResult === "ACCEPTED" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {decisionResult}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                <span>Selesai & Tutup</span>
              </Link>
            </div>
          </div>
        )}

        {/* Normal Form: Valid Token Data */}
        {!isLoading && data && !decisionResult && (
          <div className="space-y-4">
            {/* Top Welcome Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    Konfirmasi Reservasi
                  </p>
                  <h1 className="text-lg font-bold text-slate-900 mt-0.5">
                    Halo, Bapak/Ibu {data.ownerName}! 👋
                  </h1>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Menunggu Persetujuan</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Ada pesanan kamar baru yang telah membayar DP. Mohon periksa profil pemesan di bawah dan tentukan keputusan Anda.
              </p>
            </div>

            {/* Student Profile Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Profil Calon Penghuni</span>
                </h2>
                <span className="text-[11px] font-medium text-slate-400">
                  ID: #{data.booking.id.slice(0, 8)}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-lg flex items-center justify-center shrink-0 border-2 border-white shadow-xs">
                  {data.booking.userAvatar ? (
                    <Image
                      src={data.booking.userAvatar}
                      alt={data.booking.studentName}
                      fill
                      className="object-cover"
                      unoptimized={data.booking.userAvatar.startsWith("blob:") || data.booking.userAvatar.startsWith("data:")}
                    />
                  ) : (
                    <span>
                      {data.booking.studentName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0].toUpperCase())
                        .join("")}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-base truncate">
                      {data.booking.studentName}
                    </h3>
                    <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  {data.booking.userBio ? (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic">
                      &quot;{data.booking.userBio}&quot;
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">Calon penghuni terverifikasi</p>
                  )}

                  {/* WhatsApp Quick Chat */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <a
                      href={`https://wa.me/${data.booking.studentWhatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp ({data.booking.studentWhatsapp})</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking & Property Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>Detail Kamar & Tanggal</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-500 block">Properti Kos</span>
                  <p className="font-bold text-slate-900 text-sm truncate">{data.booking.propertyName}</p>
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                    Kos {data.booking.genderType}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-500 block">Tipe Kamar</span>
                  <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                    <span>{data.booking.roomTypeName || "Kamar Standar"}</span>
                  </p>
                  <span className="text-emerald-700 font-bold">
                    {formatRupiah(data.booking.pricePerMonth)} / bulan
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    Rencana Masuk (Check-In)
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {formatFullDate(data.booking.moveInDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md space-y-3">
              <p className="text-xs font-semibold text-slate-700 text-center">
                Apakah Anda menerima calon penghuni ini?
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl border border-rose-300 bg-rose-50/60 hover:bg-rose-100 text-rose-700 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision("ACCEPT")}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Terima Pesanan</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Tindakan ini bersifat final dan langsung mengabari penyewa.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alasan Penolakan */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Konfirmasi Penolakan</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menolak pesanan dari <strong>{data?.booking.studentName}</strong>. Jumlah kamar akan otomatis dikembalikan ke stok dan sistem akan memberitahukan proses pengembalian dana (*refund*) kepada calon penghuni.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alasan Penolakan (Opsional):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Kamar sedang masa renovasi, profil tidak memenuhi kriteria, dll..."
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("REJECT")}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Ya, Tolak Pesanan</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        <p>© {new Date().getFullYear()} KosPasti. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
