"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface Booking {
  id: string;
  student_name: string;
  student_whatsapp: string;
  move_in_date: string;
  status: "PENDING" | "PAID" | "APPROVED" | "ACCEPTED" | "REJECTED";
  created_at: string;
  property: {
    id: string;
    name: string;
    address: string | null;
    price_per_month: number;
    available_rooms: number;
  };
  room_type?: {
    id: string;
    name: string;
    price_per_month: number;
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
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleUpdateStatus = async (bookingId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoadingId(bookingId);
      setErrorMsg(null);

      const res = await fetch(`/api/partner/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal memperbarui status pesanan.");
        return;
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
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
    }
  };

  const filteredBookings = bookings.filter((b) => {
    let matchesFilter = true;
    if (filterStatus === "PENDING") {
      matchesFilter = b.status === "PENDING" || b.status === "PAID";
    } else if (filterStatus === "APPROVED") {
      matchesFilter = b.status === "APPROVED" || b.status === "ACCEPTED";
    } else if (filterStatus === "REJECTED") {
      matchesFilter = b.status === "REJECTED";
    }

    const matchesSearch =
      b.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.student_whatsapp.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = bookings.filter((b) => b.status === "PENDING" || b.status === "PAID").length;
  const approvedCount = bookings.filter((b) => b.status === "APPROVED" || b.status === "ACCEPTED").length;
  const rejectedCount = bookings.filter((b) => b.status === "REJECTED").length;

  const getStatusBadge = (status: Booking["status"]) => {
    if (status === "PAID") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1.5 bg-blue-100 text-blue-800 border border-blue-200">
          Sudah Bayar DP (Perlu Konfirmasi)
        </span>
      );
    }
    if (status === "PENDING") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1.5 bg-amber-100 text-amber-800 border border-amber-200">
          Menunggu Pembayaran
        </span>
      );
    }
    if (status === "APPROVED" || status === "ACCEPTED") {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
          Disetujui
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1.5 bg-rose-100 text-rose-800 border border-rose-200">
        Ditolak
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Daftar Pesanan Sewa Kos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Konfirmasi pesanan masuk dari calon penyewa dan hubungi mereka langsung via WhatsApp.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
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
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
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
                : "bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak ({rejectedCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama penyewa / kos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Bookings List / Table */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Memuat data pesanan...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Tidak Ada Pesanan</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Belum ada pesanan yang sesuai dengan filter atau kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const cleanWa = b.student_whatsapp.replace(/\D/g, "");
            const waUrl = `https://wa.me/${cleanWa}?text=Halo%20kak%20${encodeURIComponent(
              b.student_name
            )},%20saya%20pemilik%20${encodeURIComponent(
              b.property.name
            )}%20dari%20KosPasti.%20Mengenai%20pesanan%20sewa%20Anda...`;

            const isPendingAction = b.status === "PENDING" || b.status === "PAID";
            const isApproved = b.status === "APPROVED" || b.status === "ACCEPTED";

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all"
              >
                {/* Header Info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {getStatusBadge(b.status)}
                    <h3 className="font-extrabold text-slate-900 text-base">{b.student_name}</h3>
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
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition-colors shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Property & Booking Details Box */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Properti:</span>
                    </span>
                    <span className="font-bold text-slate-800">{b.property.name}</span>
                  </div>

                  {b.room_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tipe Kamar:</span>
                      </span>
                      <span className="font-bold text-slate-800">{b.room_type.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tanggal Masuk:</span>
                    </span>
                    <span className="font-bold text-slate-800">
                      {new Date(b.move_in_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tarif Sewa:</span>
                    </span>
                    <span className="font-extrabold text-emerald-700">
                      Rp {(b.room_type?.price_per_month || b.property.price_per_month).toLocaleString("id-ID")} / bln
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                {isPendingAction ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(b.id, "APPROVED")}
                      disabled={actionLoadingId === b.id}
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
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Tolak
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Status saat ini:{" "}
                      <strong className={isApproved ? "text-emerald-700" : "text-rose-700"}>
                        {isApproved ? "Disetujui" : "Ditolak"}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(
                          b.id,
                          isApproved ? "REJECTED" : "APPROVED"
                        )
                      }
                      className="text-[11px] text-slate-400 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      Ubah ke {isApproved ? "Ditolak" : "Disetujui"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
