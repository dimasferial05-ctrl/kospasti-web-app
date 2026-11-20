"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThemeImage } from "@/components/ui/ThemeImage";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Home,
  QrCode,
  Loader2,
  AlertCircle,
  FileCheck,
  Award,
  BookOpen,
} from "lucide-react";
import { TrustAura } from "@/components/ui/backgrounds";

interface BookingContractDetail {
  id: string;
  invoiceNumber?: string;
  studentName: string;
  studentWhatsapp: string;
  studentEmail: string | null;
  moveInDate: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentGatewayRef?: string | null;
  property: {
    id: string;
    name: string;
    address: string | null;
    price_per_month: number;
    image_url: string | null;
    gender_type: string;
    rules?: string | null;
    rental_terms?: string | null;
    owner?: {
      name: string;
      whatsapp_number: string;
      email?: string | null;
    } | null;
  } | null;
  roomType: {
    id: string;
    name: string;
    price_per_month: number;
    image_url: string | null;
    facilities?: string | null;
  } | null;
  roomUnit?: {
    id: string;
    unitNumber: string;
    floor: number;
    status?: string;
  } | null;
  pricing: {
    rentPrice: number;
    adminFee: number;
    securityDeposit?: number;
    totalPrice: number;
  };
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingContractDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    async function fetchContract() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Gagal memuat surat perjanjian sewa.");
        }

        if (isMounted) {
          setBooking(json.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Terjadi kesalahan saat memuat kontrak sewa.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchContract();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Menerbitkan Surat Perjanjian Sewa Kos (SPK Digital)...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-float text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Gagal Memuat Kontrak
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {error || "Dokumen kontrak tidak ditemukan atau Anda belum memiliki akses ke pesanan ini."}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push("/profil?tab=bookings")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Riwayat Pesanan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = ["PAID", "APPROVED", "ACCEPTED", "COMPLETED", "PAYOUT_PENDING", "PAYOUT_PAID"].includes(
    booking.status?.toUpperCase()
  );

  const contractDateStr = new Date(booking.createdAt).toISOString().slice(0, 7).replace("-", "");
  const contractNumber = `KP-SPK-${contractDateStr}-${booking.id.slice(0, 6).toUpperCase()}`;

  // Hitung tanggal akhir sewa 1 bulan (+30 hari dari tanggal masuk)
  const moveInDateObj = new Date(booking.moveInDate);
  const endDateObj = new Date(moveInDateObj.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-6 sm:py-10 px-4 print:p-0 print:m-0 print:bg-white print:text-black overflow-hidden">
      <TrustAura className="print:hidden" />

      {/* Inline Print Styles */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          .mobile-bottom-nav,
          button,
          .print\\:hidden {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .contract-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Screen Only) */}
      <div className="relative z-10 max-w-4xl mx-auto mb-6 flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => router.push("/profil?tab=bookings")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ke Riwayat Pesanan</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            data-testid="print-contract-button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-soft hover:shadow-float transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh PDF</span>
          </button>
        </div>
      </div>

      {!isPaid && (
        <div className="relative z-10 max-w-4xl mx-auto mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs sm:text-sm">Dokumen Kontrak Sementara (Draft)</div>
              <div className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300">
                Pesanan ini berstatus <strong>{booking.status}</strong>. Perjanjian sewa baru mengikat secara sah setelah pembayaran diverifikasi sistem.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Document Paper */}
      <div
        className="contract-paper relative z-10 max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-12 overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white print:text-black"
        id="contract-document"
      >
        {/* Header Dokumen SPK */}
        <div className="pb-6 border-b-2 border-slate-900 dark:border-slate-100 print:border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 shrink-0">
              <ThemeImage
                srcDark="/images/logo-dark.png"
                srcLight="/images/logo-light.png"
                alt="KosPasti Logo"
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl object-cover shadow-xs print:border print:border-slate-300"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-white print:text-black tracking-tight leading-none">
                  KosPasti
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 print:bg-emerald-50 print:text-emerald-800">
                  SPK Resmi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                Platform Sewa Kos Terverifikasi & Rekening Bersama Escrow
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 print:text-slate-500 uppercase tracking-wider">
              Nomor Kontrak Perjanjian
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white print:text-black">
              {contractNumber}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-500 mt-0.5">
              Tanggal Terbit: {formatDate(booking.createdAt)}
            </div>
          </div>
        </div>

        {/* Judul Surat */}
        <div className="py-6 text-center border-b border-slate-150 dark:border-slate-800 print:border-slate-300">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white print:text-black uppercase tracking-tight">
            SURAT PERJANJIAN SEWA KOS (SPK DIGITAL)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 max-w-xl mx-auto mt-1 leading-relaxed">
            Perjanjian ini dibuat secara elektronik dan mengikat secara sah antara Pengelola Kos dan Penyewa dengan penjaminan sistem transaksi aman KosPasti.
          </p>
        </div>

        {/* Klausul-Klausul Perjanjian */}
        <div className="py-6 space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 print:text-black leading-relaxed">
          {/* PASAL 1: PARA PIHAK */}
          <section className="space-y-3">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white print:text-black uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 print:text-black" />
              <span>Pasal 1: Identitas Para Pihak</span>
            </h2>
            <p>Pada hari ini telah disepakati perjanjian sewa-menyewa kamar kos oleh dan antara:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* PIHAK PERTAMA */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/80 dark:border-slate-800 print:border-slate-300 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-black">
                  PIHAK PERTAMA (Pemilik / Pengelola Kos)
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Nama Pemilik:</span>{" "}
                    <strong className="text-slate-900 dark:text-white print:text-black">
                      {booking.property?.owner?.name || "Pemilik Kos"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">WhatsApp/Telepon:</span>{" "}
                    <span className="font-mono">{booking.property?.owner?.whatsapp_number || "-"}</span>
                  </div>
                  {booking.property?.owner?.email && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Email:</span>{" "}
                      <span>{booking.property.owner.email}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Nama Kos:</span>{" "}
                    <strong>{booking.property?.name || "Kos"}</strong>
                  </div>
                </div>
              </div>

              {/* PIHAK KEDUA */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/80 dark:border-slate-800 print:border-slate-300 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-black">
                  PIHAK KEDUA (Penyewa / Mahasiswa)
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Nama Penyewa:</span>{" "}
                    <strong className="text-slate-900 dark:text-white print:text-black">
                      {booking.studentName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">WhatsApp:</span>{" "}
                    <span className="font-mono">{booking.studentWhatsapp}</span>
                  </div>
                  {booking.studentEmail && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">Email:</span>{" "}
                      <span>{booking.studentEmail}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 print:text-slate-600">ID Registrasi:</span>{" "}
                    <span className="font-mono text-[11px]">{booking.id.slice(0, 13)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PASAL 2: OBJEK & FASILITAS */}
          <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white print:text-black uppercase tracking-wide flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600 print:text-black" />
              <span>Pasal 2: Objek Sewa & Fasilitas</span>
            </h2>
            <p>
              PIHAK PERTAMA setuju menyewakan kamar hunian pada properti <strong>{booking.property?.name}</strong>{" "}
              {booking.property?.address ? `yang beralamat di ${booking.property.address}` : ""}, tipe kamar{" "}
              <strong>{booking.roomType?.name || "Kamar Reguler"}</strong>
              {booking.roomUnit && (
                <>
                  , unit nomor <strong>{booking.roomUnit.unitNumber}</strong> (Lantai {booking.roomUnit.floor})
                </>
              )}, khusus kategori{" "}
              <strong className="uppercase">{booking.property?.gender_type || "Campur"}</strong>, dengan fasilitas yang telah diverifikasi pada sistem KosPasti.
            </p>
          </section>

          {/* PASAL 3: JANGKA WAKTU SEWA */}
          <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white print:text-black uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 print:text-black" />
              <span>Pasal 3: Jangka Waktu Sewa</span>
            </h2>
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 print:bg-slate-50 border border-emerald-200/80 dark:border-emerald-800 print:border-slate-300 text-xs sm:text-sm space-y-1">
              <div>
                <span>Tanggal Mulai Menempati (Check-In):</span>{" "}
                <strong className="text-slate-900 dark:text-white print:text-black">
                  {formatDate(booking.moveInDate)}
                </strong>
              </div>
              <div>
                <span>Estimasi Akhir Periode Sewa Saat Ini:</span>{" "}
                <strong className="text-slate-900 dark:text-white print:text-black">
                  {formatDate(endDateObj.toISOString())}
                </strong>{" "}
                <span className="text-[11px] text-slate-500">(1 bulan sewa, dapat diperpanjang otomatis)</span>
              </div>
            </div>
          </section>

          {/* PASAL 4: BIAYA & JAMINAN ESCROW */}
          <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white print:text-black uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 print:text-black" />
              <span>Pasal 4: Biaya Sewa & Jaminan Escrow KosPasti</span>
            </h2>
            <p>
              PIHAK KEDUA membayar total biaya sebesar <strong>{formatRupiah(booking.pricing.totalPrice)}</strong>{" "}
              (termasuk sewa bulanan {formatRupiah(booking.pricing.rentPrice)}
              {(booking.pricing.securityDeposit || 0) > 0 ? `, deposit jaminan kerusakan fasilitas ${formatRupiah(booking.pricing.securityDeposit || 0)},` : ""} dan biaya administrasi platform{" "}
              {formatRupiah(booking.pricing.adminFee)}). Seluruh dana sewa ditahan di rekening bersama KosPasti (Escrow) dan baru diteruskan ke PIHAK PERTAMA setelah masa garansi kedatangan 12 jam selesai tanpa sengketa.
            </p>
            {(booking.pricing.securityDeposit || 0) > 0 && (
              <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 print:text-slate-800">
                Uang jaminan kerusakan sebesar <strong>{formatRupiah(booking.pricing.securityDeposit || 0)}</strong> disimpan aman pada sistem Rekening Bersama KosPasti dan wajib dikembalikan 100% kepada PIHAK KEDUA saat masa tinggal berakhir (checkout), terkecuali jika terbukti terdapat kerusakan fisik fasilitas atau kehilangan kunci kamar oleh kelalaian penyewa.
              </p>
            )}
          </section>

          {/* PASAL 5: TATA TERTIB & KETENTUAN HUNIAN */}
          <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white print:text-black uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600 print:text-black" />
              <span>Pasal 5: Tata Tertib & Ketentuan Hunian</span>
            </h2>
            <div className="space-y-2 text-xs">
              <div>
                <strong>Aturan Rumah Kos:</strong>{" "}
                <span>
                  {booking.property?.rules ||
                    "Menjaga kebersihan bersama, menghormati ketenangan penghuni lain, mematikan listrik/air saat tidak digunakan, dan mematuhi jam bertamu sesuai ketentuan pengelola."}
                </span>
              </div>
              {booking.property?.rental_terms && (
                <div>
                  <strong>Ketentuan Tambahan:</strong>{" "}
                  <span>{booking.property.rental_terms}</span>
                </div>
              )}
            </div>
          </section>

          {/* PASAL 6: PERLINDUNGAN & PENYELESAIAN SENGKETA */}
          <section className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white print:text-black uppercase tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 print:text-black" />
              <span>Pasal 6: Hak Perlindungan Garansi 12 Jam</span>
            </h2>
            <p className="text-xs">
              Apabila saat tiba di lokasi kondisi kamar terbukti tidak sesuai dengan spesifikasi terdaftar atau kamar tidak tersedia, PIHAK KEDUA berhak mengajukan sanggahan resmi dalam waktu 12 jam sejak check-in untuk memperoleh pengembalian dana (refund) penuh sesuai kebijakan KosPasti.
            </p>
          </section>
        </div>

        {/* Pengesahan Tanda Tangan Digital & Stempel */}
        <div className="pt-8 mt-6 border-t-2 border-slate-200 dark:border-slate-800 print:border-black">
          <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-slate-600 mb-6">
            PENGESAHAN DOKUMEN PERJANJIAN SECARA ELEKTRONIK
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 items-end text-center">
            {/* Tanda Tangan Pihak Pertama */}
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 print:text-slate-600">
                Pihak Pertama (Pemilik)
              </div>
              <div className="h-16 flex items-center justify-center">
                <div className="border border-dashed border-emerald-400 dark:border-emerald-600 px-3 py-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  TERTANDATANGANI SECARA DIGITAL
                </div>
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white print:text-black border-t border-slate-300 dark:border-slate-700 print:border-slate-400 pt-1">
                {booking.property?.owner?.name || "Pemilik Kos"}
              </div>
            </div>

            {/* Stempel Resmi KosPasti */}
            <div className="hidden sm:flex flex-col items-center space-y-2">
              <div className="relative w-16 h-16 rounded-full border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 flex flex-col items-center justify-center p-1 bg-emerald-50/40 dark:bg-emerald-950/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">KOSPASTI</span>
                <span className="text-[6px] tracking-widest font-bold">VERIFIED</span>
              </div>
              <div className="text-[9px] text-slate-400 print:text-slate-500 font-mono">
                SECURE-ID: {booking.id.slice(0, 8).toUpperCase()}
              </div>
            </div>

            {/* Tanda Tangan Pihak Kedua */}
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 print:text-slate-600">
                Pihak Kedua (Penyewa)
              </div>
              <div className="h-16 flex items-center justify-center">
                <div className="border border-dashed border-emerald-400 dark:border-emerald-600 px-3 py-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  TERTANDATANGANI SECARA DIGITAL
                </div>
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white print:text-black border-t border-slate-300 dark:border-slate-700 print:border-slate-400 pt-1">
                {booking.studentName}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 print:border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-500 gap-2">
            <div>Dokumen ini sah dan diakui secara digital melalui platform KosPasti.</div>
            <div className="font-mono">Verifikasi Online: https://kospasti.com/contract/{booking.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
