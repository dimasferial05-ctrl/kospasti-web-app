"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  Calendar,
  Building2,
  DoorOpen,
  User,
  Phone,
  FileCheck2,
  Lock,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { ThemeImage } from "@/components/ui/ThemeImage";

interface InspectionData {
  id: string;
  booking_id: string;
  inspector_role: string;
  inspected_at: string;
  ac_condition: string;
  ac_notes?: string | null;
  ac_photo_url?: string | null;
  bed_condition: string;
  bed_notes?: string | null;
  bed_photo_url?: string | null;
  walls_condition: string;
  walls_notes?: string | null;
  walls_photo_url?: string | null;
  bathroom_condition: string;
  bathroom_notes?: string | null;
  bathroom_photo_url?: string | null;
  general_notes?: string | null;
  additional_photos?: string | null;
  is_locked: boolean;
  tenant_confirmed_at?: string | null;
}

interface BookingData {
  id: string;
  status: string;
  property_name: string;
  property_address: string;
  room_type_name?: string | null;
  room_unit_number?: string | null;
  student_name: string;
  student_whatsapp: string;
  move_in_date: string;
}

export default function CheckinInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/bookings/${bookingId}/inspection`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Gagal memuat berita acara inspeksi.");
        }
        setBooking(data.booking);
        setInspection(data.inspection);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data inspeksi.");
      } finally {
        setLoading(false);
      }
    }
    if (bookingId) {
      loadData();
    }
  }, [bookingId]);

  const handleConfirmTenant = async () => {
    try {
      setIsConfirming(true);
      const res = await fetch(`/api/bookings/${bookingId}/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRM_TENANT" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengonfirmasi BAST.");
      }
      setInspection(data.inspection);
      setConfirmSuccess(true);
    } catch (err: any) {
      alert(err.message || "Gagal mengonfirmasi BAST.");
    } finally {
      setIsConfirming(false);
    }
  };

  const getConditionBadge = (condition: string) => {
    if (condition === "GOOD") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Kondisi Baik
        </span>
      );
    }
    if (condition === "DAMAGED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Cacat Awal (Bukan Tanggungan)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <MinusCircle className="w-3.5 h-3.5 text-slate-500" />
        Tidak Tersedia
      </span>
    );
  };

  const renderFacilityCard = (
    title: string,
    condition: string,
    notes?: string | null,
    photoUrl?: string | null
  ) => {
    return (
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="font-extrabold text-sm text-slate-900">{title}</h4>
            {getConditionBadge(condition)}
          </div>
          {notes && (
            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
              &quot;{notes}&quot;
            </p>
          )}
        </div>

        <div className="pt-2">
          {photoUrl ? (
            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <Image
                src={photoUrl}
                alt={`Bukti fisik ${title}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full h-24 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
              Tidak ada lampiran foto
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">
            Memuat Berita Acara Digital...
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Berita Acara Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500">{error || "Data pesanan tidak dapat diakses."}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Belum Ada Berita Acara Inspeksi
          </h2>
          <p className="text-xs text-slate-500">
            Kondisi kamar belum didokumentasikan oleh mitra kos untuk pesanan ini.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-3 sm:px-6 print:p-0 print:bg-white font-sans">
      {/* Action Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/receipt/${booking.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-emerald-600" />
            <span>Kuitansi Pembayaran</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen BAST (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Document Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <ThemeImage
              srcLight="/logo.png"
              srcDark="/logo.png"
              alt="KosPasti Logo"
              width={130}
              height={38}
              priority
              className="h-8 w-auto object-contain"
            />
            <div className="h-6 w-px bg-slate-300 hidden sm:block" />
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-700 block">
                Dokumen Resmi KosPasti Escrow
              </span>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                BERITA ACARA SERAH TERIMA KONDISI KAMAR (BAST)
              </h1>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-0.5">
            <span className="text-slate-400">ID Dokumen:</span>
            <p className="font-mono font-bold text-slate-800">{inspection.id.slice(0, 13).toUpperCase()}</p>
            <span className="text-[11px] text-slate-500">
              Booking Ref: {booking.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Lock Baseline Badge */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">
              Baseline Condition Terkunci Permanen
            </span>
            <span className="hidden md:inline text-slate-500 text-[11px]">
              — Menjadi acuan sah klaim deposit saat masa sewa berakhir.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 shrink-0">
            Inspeksi: {new Date(inspection.inspected_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Booking & Tenant Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-150 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{booking.property_name}</span>
            </div>
            <p className="text-slate-500">{booking.property_address}</p>
            <div className="flex items-center gap-2 pt-1 font-semibold text-emerald-700">
              {booking.room_type_name && <span>Tipe: {booking.room_type_name}</span>}
              {booking.room_unit_number && (
                <span className="inline-flex items-center gap-1 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                  <DoorOpen className="w-3 h-3" />
                  Kamar No: {booking.room_unit_number}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Penyewa: {booking.student_name}</span>
            </div>
            <p className="text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{booking.student_whatsapp}</span>
            </p>
            <p className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Tanggal Masuk: {new Date(booking.move_in_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Facility Grid (4 items) */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Hasil Pemeriksaan Fisik Fasilitas Kamar</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFacilityCard(
              "1. Air Conditioner (AC)",
              inspection.ac_condition,
              inspection.ac_notes,
              inspection.ac_photo_url
            )}
            {renderFacilityCard(
              "2. Kasur & Springbed",
              inspection.bed_condition,
              inspection.bed_notes,
              inspection.bed_photo_url
            )}
            {renderFacilityCard(
              "3. Dinding, Cat & Plafon",
              inspection.walls_condition,
              inspection.walls_notes,
              inspection.walls_photo_url
            )}
            {renderFacilityCard(
              "4. Kamar Mandi & Sanitasi",
              inspection.bathroom_condition,
              inspection.bathroom_notes,
              inspection.bathroom_photo_url
            )}
          </div>
        </div>

        {/* General Notes */}
        {inspection.general_notes && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800">Catatan Tambahan & Inventaris Kunci:</span>
            <p className="text-slate-600 leading-relaxed">{inspection.general_notes}</p>
          </div>
        )}

        {/* Signatures & Confirmations Section */}
        <div className="pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-4 text-center text-xs">
            {/* Mitra Side */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 space-y-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                Pihak Pertama (Pemilik Kos)
              </span>
              <div className="h-16 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  Terverifikasi Mitra
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 font-bold text-slate-800">
                Pemeriksa: {inspection.inspector_role === "PARTNER" ? "Pemilik Kos" : "Admin"}
              </div>
            </div>

            {/* Tenant Side */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 space-y-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                Pihak Kedua (Penyewa Kamar)
              </span>
              <div className="h-16 flex items-center justify-center">
                {inspection.tenant_confirmed_at ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    Disetujui Penyewa
                  </span>
                ) : confirmSuccess ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    Baru Saja Dikonfirmasi
                  </span>
                ) : (
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs italic block">
                      Menunggu Persetujuan
                    </span>
                    <button
                      type="button"
                      disabled={isConfirming}
                      onClick={handleConfirmTenant}
                      className="print:hidden px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      {isConfirming ? "Memproses..." : "Saya Setuju dengan BAST Ini"}
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 pt-2 font-bold text-slate-800">
                {booking.student_name}
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="text-[10px] text-slate-400 text-center leading-relaxed pt-2 print:pt-6">
          Dokumen ini diterbitkan secara otomatis dan sah oleh platform KosPasti melalui mekanisme tanda tangan digital sistem. Data foto dan kondisi fisik tersimpan aman serta menjadi acuan mutlak resolusi sengketa deposit (Escrow).
        </div>
      </div>
    </div>
  );
}
