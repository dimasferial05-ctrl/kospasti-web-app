"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Calendar,
  Building2,
  MessageCircle,
  Loader2,
  Info,
  Search,
  Check,
  X,
  BedDouble,
  DollarSign,
  HelpCircle,
  Download,
  ShieldCheck,
  AlertTriangle,
  DoorOpen,
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/Tooltip";
import { ExportFinancialModal } from "@/components/partner/ExportFinancialModal";

interface Booking {
  id: string;
  student_name: string;
  student_whatsapp: string;
  move_in_date: string;
  status: string;
  created_at: string;
  amount?: number;
  checkin_confirmed_at?: string | null;
  cancellation_reason?: string | null;
  refund_bank_name?: string | null;
  refund_account_number?: string | null;
  refund_account_holder?: string | null;
  refund_note?: string | null;
  refunded_at?: string | null;
  security_deposit?: number;
  deposit_status?: string | null;
  deposit_refunded_at?: string | null;
  deposit_claimed_amount?: number | null;
  deposit_claim_reason?: string | null;
  checkout_confirmed_at?: string | null;
  property: {
    id: string;
    name: string;
    address: string | null;
    price_per_month?: number | null;
    available_rooms?: number | null;
  };
  room_type?: {
    id: string;
    name: string;
    price_per_month?: number | null;
  } | null;
  room_unit?: {
    id: string;
    unit_number: string;
    floor?: number | null;
    status: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
  } | null;
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED" | "REFUND">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmCheckinBooking, setConfirmCheckinBooking] = useState<Booking | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [confirmCheckoutBooking, setConfirmCheckoutBooking] = useState<Booking | null>(null);
  const [checkoutCondition, setCheckoutCondition] = useState<"GOOD" | "DAMAGED">("GOOD");
  const [claimAmount, setClaimAmount] = useState<string>("");
  const [claimReason, setClaimReason] = useState<string>("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Modal Penetapan Unit Kamar Fisik saat Approve
  const [approvingBooking, setApprovingBooking] = useState<Booking | null>(null);
  const [availableUnits, setAvailableUnits] = useState<
    Array<{ id: string; unit_number: string; floor?: number | null; room_type?: { name: string } | null }>
  >([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [isCheckingUnits, setIsCheckingUnits] = useState(false);



  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/partner/bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setErrorMsg(data.error || "Gagal memuat daftar pesanan.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (
    bookingId: string,
    status: "APPROVED" | "REJECTED",
    roomUnitId?: string | null
  ) => {
    try {
      setActionLoadingId(bookingId);
      setErrorMsg(null);

      const res = await fetch(`/api/partner/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(roomUnitId ? { room_unit_id: roomUnitId } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal memperbarui status pesanan.");
        return;
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status,
                ...(data.booking?.room_unit ? { room_unit: data.booking.room_unit } : {}),
              }
            : b
        )
      );

      setSuccessMsg(
        status === "APPROVED"
          ? "Pesanan berhasil disetujui! Notifikasi WhatsApp telah dikirimkan ke calon penyewa."
          : "Pesanan telah ditolak dan kuota kamar telah dikembalikan."
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg("Terjadi kesalahan saat memproses status.");
    } finally {
      setActionLoadingId(null);
      setApprovingBooking(null);
    }
  };

  const handleInitiateApprove = async (b: Booking) => {
    try {
      setActionLoadingId(b.id);
      setIsCheckingUnits(true);

      // Cek apakah properti memiliki unit kamar fisik (inventaris nomor kamar)
      const res = await fetch(`/api/partner/properties/${b.property.id}/units?status=VACANT`);
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && Array.isArray(data.data) && data.data.length > 0) {
        // Tampilkan modal pemilihan nomor kamar
        setAvailableUnits(data.data);
        setSelectedUnitId(data.data[0]?.id || "");
        setApprovingBooking(b);
      } else {
        // Jika kos belum memiliki inventaris kamar fisik / tipe standar, langsung setujui tanpa unit
        await handleUpdateStatus(b.id, "APPROVED");
      }
    } catch {
      await handleUpdateStatus(b.id, "APPROVED");
    } finally {
      setIsCheckingUnits(false);
      setActionLoadingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    let matchesFilter = true;
    if (filterStatus === "PENDING") {
      matchesFilter = b.status === "PENDING" || b.status === "PAID";
    } else if (filterStatus === "APPROVED") {
      matchesFilter = [
        "APPROVED",
        "ACCEPTED",
        "COMPLETED",
        "PAYOUT_PENDING",
        "PAYOUT_PAID",
        "DISPUTED",
      ].includes(b.status);
    } else if (filterStatus === "REJECTED") {
      matchesFilter = b.status === "REJECTED";
    } else if (filterStatus === "REFUND") {
      matchesFilter = b.status === "REFUND_REQUESTED" || b.status === "REFUNDED" || b.status === "CANCELLED";
    }

    const matchesSearch =
      (b.student_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.property?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.student_whatsapp || "").includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = bookings.filter((b) => b.status === "PENDING" || b.status === "PAID").length;
  const approvedCount = bookings.filter((b) =>
    ["APPROVED", "ACCEPTED", "COMPLETED", "PAYOUT_PENDING", "PAYOUT_PAID", "DISPUTED"].includes(b.status)
  ).length;
  const rejectedCount = bookings.filter((b) => b.status === "REJECTED").length;
  const refundCount = bookings.filter((b) => ["REFUND_REQUESTED", "REFUNDED", "CANCELLED"].includes(b.status)).length;

  const getStatusBadge = (status: string) => {
    if (status === "PAID") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
          <span>Sudah Bayar DP (Perlu Konfirmasi)</span>
          <HelpTooltip text="Calon penyewa telah membayar DP. Klik 'Setujui' jika kamar siap, atau 'Tolak' untuk mengembalikan DP." />
        </span>
      );
    }
    if (status === "PENDING") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <span>Menunggu Pembayaran</span>
          <HelpTooltip text="Calon penyewa sedang memproses pembayaran DP. Anda akan menerima notifikasi WA otomatis saat lunas." />
        </span>
      );
    }
    if (status === "APPROVED" || status === "ACCEPTED") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <span>Disetujui</span>
          <HelpTooltip text="Pesanan telah Anda setujui. Penyewa telah menerima notifikasi WA untuk persiapan check-in." />
        </span>
      );
    }
    if (status === "COMPLETED") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
          <Clock className="w-3 h-3 text-indigo-600" />
          <span>Check-In Dikonfirmasi (Grace Period 12 Jam)</span>
          <HelpTooltip text="Check-in telah dikonfirmasi oleh Anda. Masa tenggang 12 jam sedang berjalan untuk verifikasi sebelum dana dicairkan." />
        </span>
      );
    }
    if (status === "DISPUTED") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
          <Info className="w-3 h-3 text-rose-600" />
          <span>Dalam Sanggahan (Dispute)</span>
          <HelpTooltip text="Penyewa mengajukan sanggahan kendala check-in. Tim Admin KosPasti sedang menginvestigasi masalah ini." />
        </span>
      );
    }
    if (status === "PAYOUT_PENDING") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Menunggu Pencairan Dana</span>
          <HelpTooltip text="Grace period telah selesai tanpa sanggahan. Permintaan payout telah dibuat dan sedang menunggu pemrosesan admin." />
        </span>
      );
    }
    if (status === "PAYOUT_PAID") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Dana Sudah Dicairkan</span>
          <HelpTooltip text="Dana sewa telah berhasil dicairkan oleh Admin KosPasti ke rekening Anda." />
        </span>
      );
    }
    if (status === "REFUND_REQUESTED") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Batal (Refund Diproses Admin)</span>
          <HelpTooltip text="Penyewa membatalkan pesanan. Kuota kamar Anda telah dilepas kembali (+1). Pengembalian dana (Escrow) ditangani langsung oleh Admin KosPasti." />
        </span>
      );
    }
    if (status === "REFUNDED") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
          <CheckCircle2 className="w-3 h-3 text-sky-600" />
          <span>Dana Dikembalikan oleh Admin</span>
          <HelpTooltip text="Pengembalian dana (refund) telah berhasil ditransfer oleh Admin KosPasti ke penyewa." />
        </span>
      );
    }
    if (status === "CANCELLED") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span>Dibatalkan</span>
          <HelpTooltip text="Pesanan dibatalkan sebelum pembayaran dilakukan. Kamar otomatis kembali ke sistem." />
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
        <span>Ditolak</span>
        <HelpTooltip text="Pesanan dibatalkan/ditolak. Kuota kamar otomatis dikembalikan dan DP direfund ke penyewa." />
      </span>
    );
  };

  const renderCheckoutControl = (b: Booking) => {
    if (b.checkout_confirmed_at) {
      return (
        <div className="mt-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Kamar Telah Checkout
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {new Date(b.checkout_confirmed_at).toLocaleDateString("id-ID")}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            {b.deposit_status === "REFUNDED" ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Deposit jaminan 100% telah dikembalikan ke penyewa.
              </span>
            ) : b.deposit_status === "CLAIMED" ? (
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                Klaim kerusakan: Rp{(b.deposit_claimed_amount || 0).toLocaleString("id-ID")} ({b.deposit_claim_reason || "Kerusakan kamar"}).
              </span>
            ) : (
              <span>Pemeriksaan kamar selesai dan kuota kamar telah dikembalikan (+1).</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          setConfirmCheckoutBooking(b);
          setCheckoutCondition("GOOD");
          setClaimAmount("");
          setClaimReason("");
        }}
        className="w-full mt-2 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-sky-600/20 cursor-pointer"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Konfirmasi Checkout & Pelepasan Deposit</span>
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Daftar Pesanan Sewa Kos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Konfirmasi pesanan masuk dari calon penyewa dan hubungi mereka langsung via WhatsApp.
          </p>
        </div>

        <Link
          href="/bantuan?tab=partner&article=persetujuan-wa-vs-dasbor"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 text-xs font-bold transition-all shadow-xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Panduan Konfirmasi Pesanan</span>
        </Link>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "ALL"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Semua ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === "PENDING"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Perlu Konfirmasi ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("APPROVED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === "APPROVED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui ({approvedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("REJECTED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === "REJECTED"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak ({rejectedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("REFUND")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === "REFUND"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Batal & Refund ({refundCount})</span>
          </button>
        </div>

        {/* Search Input & Export Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama penyewa / kos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            disabled={bookings.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-soft hover:shadow-float transition-all duration-200 cursor-pointer shrink-0"
            title="Unduh rekapitulasi data pesanan dan rincian keuangan ke format CSV/Excel atau PDF siap cetak"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh Laporan Keuangan</span>
          </button>
        </div>
      </div>

      {/* Bookings List / Table */}
      {isLoading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Memuat data pesanan...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tidak Ada Pesanan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Belum ada pesanan yang sesuai dengan filter atau kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const cleanWa = (b.student_whatsapp || "").replace(/\D/g, "");
            const waUrl = `https://wa.me/${cleanWa}?text=Halo%20kak%20${encodeURIComponent(
              b.student_name || "Penyewa"
            )},%20saya%20pemilik%20${encodeURIComponent(
              b.property?.name || "Kos"
            )}%20dari%20KosPasti.%20Mengenai%20pesanan%20sewa%20Anda...`;

            const isPendingAction = b.status === "PENDING" || b.status === "PAID";
            const isApproved = b.status === "APPROVED" || b.status === "ACCEPTED";
            const isRefundRequested = b.status === "REFUND_REQUESTED";
            const isRefunded = b.status === "REFUNDED";
            const isCancelled = b.status === "CANCELLED";
            const displayPrice =
              b.room_type?.price_per_month ?? b.property?.price_per_month ?? b.amount ?? 0;

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
              >
                {/* Header Info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {getStatusBadge(b.status)}
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {b.student_name || "Penyewa"}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Dipesan pada{" "}
                      {new Date(b.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/60 transition-colors shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Property & Booking Details Box */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Properti:</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {b.property?.name || "Properti Kos"}
                    </span>
                  </div>

                  {b.room_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tipe Kamar:</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {b.room_type.name}
                      </span>
                    </div>
                  )}

                  {b.room_unit && (
                    <div className="flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/30 p-1.5 px-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Nomor Kamar:</span>
                      </span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        {b.room_unit.unit_number} {b.room_unit.floor ? `(Lt. ${b.room_unit.floor})` : ""}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tanggal Masuk:</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {new Date(b.move_in_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tarif Sewa:</span>
                    </span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      Rp {Number(displayPrice || 0).toLocaleString("id-ID")} / bln
                    </span>
                  </div>
                </div>

                {/* Refund & Cancellation Information Box */}
                {(isRefundRequested || isRefunded || isCancelled || b.cancellation_reason) && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 dark:text-amber-200">Informasi Pembatalan</span>
                      {b.refunded_at && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(b.refunded_at).toLocaleDateString("id-ID")}
                        </span>
                      )}
                    </div>

                    {b.cancellation_reason && (
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-slate-200">Alasan:</strong> {b.cancellation_reason}
                      </p>
                    )}

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 space-y-1">
                      <p className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kuota kamar otomatis dilepas kembali (+1)</span>
                      </p>
                      {isRefundRequested && (
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          Dana pembayaran berada di rekening penampung (Escrow) KosPasti dan <strong>sedang diproses pengembaliannya oleh Admin KosPasti</strong> ke penyewa. Mitra tidak perlu mentransfer dana.
                        </p>
                      )}
                      {isRefunded && (
                        <p className="text-sky-700 dark:text-sky-400 text-[11px] leading-relaxed">
                          Pengembalian dana telah selesai ditransfer oleh Admin KosPasti ke penyewa.
                          {b.refund_note && <span> Ref: <em>{b.refund_note}</em></span>}
                        </p>
                      )}
                      {isCancelled && (
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Pesanan dibatalkan sebelum pembayaran dilakukan. Tidak ada transaksi dana yang terjadi.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Controls */}
                {isPendingAction ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleInitiateApprove(b)}
                      disabled={actionLoadingId === b.id || isCheckingUnits}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoadingId === b.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui Pesanan</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(b.id, "REJECTED")}
                      disabled={actionLoadingId === b.id}
                      className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Tolak
                    </button>
                  </div>
                ) : isApproved ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const moveIn = new Date(b.move_in_date);
                      moveIn.setHours(0, 0, 0, 0);
                      const isDateReady = today >= moveIn;

                      return isDateReady ? (
                        <button
                          type="button"
                          onClick={() => setConfirmCheckinBooking(b)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Konfirmasi Check-In</span>
                        </button>
                      ) : (
                        <div className="py-2 px-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 font-medium">
                          Belum waktunya (Tersedia mulai {new Date(b.move_in_date).toLocaleDateString("id-ID")})
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>Status: <strong className="text-emerald-700 dark:text-emerald-400">Disetujui</strong></span>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(b.id, "REJECTED")}
                        className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline cursor-pointer"
                      >
                        Ubah ke Ditolak
                      </button>
                    </div>
                  </div>
                ) : b.status === "COMPLETED" ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Check-In Dikonfirmasi</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Masa tenggang (Grace Period 12 jam) sedang berjalan. Payout otomatis dibuat ke antrean admin setelah masa tenggang berakhir.
                    </p>
                    {renderCheckoutControl(b)}
                  </div>
                ) : b.status === "PAYOUT_PENDING" ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Menunggu Pencairan Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Permintaan pencairan dana telah dibuat. Admin KosPasti akan memproses transfer ke rekening mitra Anda.
                    </p>
                    {renderCheckoutControl(b)}
                  </div>
                ) : b.status === "PAYOUT_PAID" ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dana Berhasil Dicairkan</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Dana sewa telah dicairkan ke rekening Anda. Cek rincian di <Link href="/partner/dashboard/payouts" className="text-emerald-600 underline font-semibold">Riwayat Payout</Link>.
                    </p>
                    {renderCheckoutControl(b)}
                  </div>
                ) : b.status === "DISPUTED" ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-rose-600" />
                      <span>Dispute Diajukan Penyewa</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Penyewa mengajukan komplain saat grace period. Admin sedang menginvestigasi kendala ini.
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Status:{" "}
                      <strong
                        className={
                          isRefunded
                            ? "text-sky-700 dark:text-sky-400"
                            : isRefundRequested
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-rose-700 dark:text-rose-400"
                        }
                      >
                        {isRefunded
                          ? "Dana Dikembalikan"
                          : isRefundRequested
                          ? "Menunggu Refund (Admin)"
                          : isCancelled
                          ? "Dibatalkan"
                          : "Ditolak"}
                      </strong>
                    </span>
                    {!isRefunded && !isCancelled && !isRefundRequested && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(b.id, "APPROVED")}
                        className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline cursor-pointer"
                      >
                        Ubah ke Disetujui
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Konfirmasi Check-In */}
      {confirmCheckinBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Konfirmasi Check-In Penyewa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {confirmCheckinBooking.property.name}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Penyewa:</span>
                <span className="font-bold text-slate-900 dark:text-white">{confirmCheckinBooking.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Masuk:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {new Date(confirmCheckinBooking.move_in_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin <strong>{confirmCheckinBooking.student_name}</strong> sudah check-in dan menempati kamar? Dana sewa akan dicairkan ke rekening Anda setelah melewati masa tenggang (grace period) 12 jam.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={checkinLoading}
                onClick={() => setConfirmCheckinBooking(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={checkinLoading}
                onClick={async () => {
                  setCheckinLoading(true);
                  try {
                    const res = await fetch(`/api/partner/bookings/${confirmCheckinBooking.id}/checkin`, {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                      throw new Error(data.error || "Gagal mengonfirmasi check-in");
                    }
                    setSuccessMsg(data.message || "Check-in berhasil dikonfirmasi! Grace period 12 jam dimulai.");
                    setConfirmCheckinBooking(null);
                    fetchBookings();
                  } catch (err: any) {
                    setErrorMsg(err.message || "Terjadi kesalahan saat mengonfirmasi check-in.");
                  } finally {
                    setCheckinLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-colors"
              >
                {checkinLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Ya, Konfirmasi Check-In"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Checkout & Pelepasan Deposit */}
      {confirmCheckoutBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Checkout Kamar & Pelepasan Deposit
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {confirmCheckoutBooking.property.name}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Penyewa:</span>
                <span className="font-bold text-slate-900 dark:text-white">{confirmCheckoutBooking.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Deposit Ditahan:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  Rp{(confirmCheckoutBooking.security_deposit || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                Hasil Pemeriksaan Kondisi Kamar:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutCondition("GOOD")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    checkoutCondition === "GOOD"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kondisi Baik</span>
                  </div>
                  <div className="text-[11px] font-normal text-slate-500">
                    Bebas kerusakan, deposit 100% kembali ke penyewa.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutCondition("DAMAGED")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    checkoutCondition === "DAMAGED"
                      ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Ada Kerusakan</span>
                  </div>
                  <div className="text-[11px] font-normal text-slate-500">
                    Kunci hilang atau fasilitas rusak (klaim deposit).
                  </div>
                </button>
              </div>

              {checkoutCondition === "DAMAGED" && (
                <div className="space-y-3 pt-2 p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-2xl animate-in fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nominal Potongan Kerusakan (Maksimal Rp{(confirmCheckoutBooking.security_deposit || 0).toLocaleString("id-ID")}):
                    </label>
                    <input
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="Contoh: 150000"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Alasan / Keterangan Kerusakan Fasilitas:
                    </label>
                    <textarea
                      value={claimReason}
                      onChange={(e) => setClaimReason(e.target.value)}
                      placeholder="Contoh: Kunci kamar hilang dan engsel jendela kamar patah."
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => setConfirmCheckoutBooking(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={async () => {
                  setCheckoutLoading(true);
                  try {
                    const res = await fetch(`/api/partner/bookings/${confirmCheckoutBooking.id}/checkout`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        condition: checkoutCondition,
                        claimAmount: checkoutCondition === "DAMAGED" ? Number(claimAmount) : 0,
                        claimReason: checkoutCondition === "DAMAGED" ? claimReason : undefined,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                      throw new Error(data.error || "Gagal memproses checkout kamar.");
                    }
                    setSuccessMsg(data.message || "Checkout kamar dan pelepasan deposit berhasil diproses.");
                    setConfirmCheckoutBooking(null);
                    fetchBookings();
                  } catch (err: any) {
                    setErrorMsg(err.message || "Terjadi kesalahan saat memproses checkout.");
                  } finally {
                    setCheckoutLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Proses Checkout & Pelepasan Deposit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Penetapan Unit Kamar Spesifik saat Menyetujui Booking */}
      {approvingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tetapkan Nomor Kamar Fisik
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih nomor kamar untuk <strong>{approvingBooking.student_name}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Properti:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {approvingBooking.property.name}
                </span>
              </div>
              {approvingBooking.room_type && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tipe Kamar:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {approvingBooking.room_type.name}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Pilih Kamar yang Siap Huni (Status: VACANT) <span className="text-emerald-600">*</span>
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Tetapkan Nanti / Tanpa Nomor Kamar Spesifik --</option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    Kamar No. {u.unit_number} {u.floor ? `(Lantai ${u.floor})` : ""} {u.room_type ? `[${u.room_type.name}]` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                Nomor kamar yang dipilih akan tercetak secara otomatis di lembar Kontrak Digital (SPK) dan Kuitansi Resmi penyewa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApprovingBooking(null)}
                disabled={Boolean(actionLoadingId)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={Boolean(actionLoadingId)}
                onClick={() =>
                  handleUpdateStatus(
                    approvingBooking.id,
                    "APPROVED",
                    selectedUnitId || null
                  )
                }
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {actionLoadingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Setujui &amp; Konfirmasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ekspor Laporan Keuangan Mitra */}
      <ExportFinancialModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        bookings={bookings}
      />
    </div>
  );
}
