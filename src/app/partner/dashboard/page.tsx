"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  BedDouble,
  CalendarCheck,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Phone,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/Tooltip";

interface StatsData {
  totalProperties: number;
  totalAvailableRooms: number;
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
}

interface PropertyItem {
  id: string;
  name: string;
  address: string | null;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  image_url: string | null;
}

interface BookingItem {
  id: string;
  student_name: string;
  student_whatsapp: string;
  move_in_date: string;
  status: string;
  created_at: string;
  property: {
    name: string;
    price_per_month: number;
  };
}

export default function PartnerOverviewPage() {
  const [stats, setStats] = useState<StatsData>({
    totalProperties: 0,
    totalAvailableRooms: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
  });

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, propsRes, booksRes] = await Promise.all([
        fetch("/api/partner/stats").then((r) => r.json()),
        fetch("/api/partner/properties").then((r) => r.json()),
        fetch("/api/partner/bookings").then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (propsRes.success) setProperties(propsRes.properties || []);
      if (booksRes.success) setRecentBookings(booksRes.bookings?.slice(0, 5) || []);
    } catch (error) {
      console.error("Gagal memuat ringkasan dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRoomQuick = async (propertyId: string, delta: number) => {
    const target = properties.find((p) => p.id === propertyId);
    if (!target) return;

    const newRooms = Math.max(0, target.available_rooms + delta);
    if (newRooms === target.available_rooms) return;

    // Optimistic UI update
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, available_rooms: newRooms } : p))
    );
    setStats((prev) => ({
      ...prev,
      totalAvailableRooms: Math.max(0, prev.totalAvailableRooms + delta),
    }));

    try {
      await fetch(`/api/partner/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available_rooms: newRooms }),
      });
    } catch (error) {
      console.error("Gagal update kamar:", error);
      fetchData(); // Rollback jika gagal
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoadingId(bookingId);
      const res = await fetch(`/api/partner/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        setRecentBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        );
        // Refresh stats
        const statsRes = await fetch("/api/partner/stats").then((r) => r.json());
        if (statsRes.success) setStats(statsRes.stats);
      }
    } catch (error) {
      console.error("Gagal mengubah status booking:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Ringkasan Dasbor Mitra
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pantau status ketersediaan kamar dan kelola pesanan masuk dari calon penyewa.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properti */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Properti
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {isLoading ? "..." : stats.totalProperties}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Unit properti aktif</span>
        </div>

        {/* Total Kamar Tersedia */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kamar Kosong
              </span>
              <HelpTooltip text="Total seluruh kamar kosong dari seluruh kos aktif Anda yang siap disewa." />
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-600 mt-2">
            {isLoading ? "..." : stats.totalAvailableRooms}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Siap dihuni calon penyewa</span>
        </div>

        {/* Total Pesanan Masuk */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pesanan
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {isLoading ? "..." : stats.totalBookings}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Riwayat booking masuk</span>
        </div>

        {/* Pesanan Pending */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Perlu Konfirmasi
              </span>
              <HelpTooltip text="Pesanan dari penyewa yang sudah membayar DP dan menunggu persetujuan Anda." />
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {isLoading ? "..." : stats.pendingBookings}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Menunggu persetujuan Anda</span>
        </div>
      </div>

      {/* Main Content 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Properti & Update Cepat */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Ketersediaan Kamar Cepat</span>
              <HelpTooltip text="Gunakan tombol (+) atau (-) untuk menambah/mengurangi sisa kamar secara instan tanpa perlu masuk ke form edit properti." />
            </h2>
            <Link
              href="/partner/dashboard/properties"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Lihat Semua Properti</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat data properti...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-700">Belum ada properti kos terdaftar.</p>
              <Link
                href="/partner/dashboard/properties"
                className="mt-3 inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                + Tambah Properti Sekarang
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <Image
                        src={prop.image_url || "/images/placeholder.jpg"}
                        alt={prop.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            prop.gender_type === "PUTRA"
                              ? "bg-blue-100 text-blue-800"
                              : prop.gender_type === "PUTRI"
                              ? "bg-pink-100 text-pink-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {prop.gender_type}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{prop.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{prop.address}</p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        Rp {prop.price_per_month.toLocaleString("id-ID")} / bulan
                      </p>
                    </div>
                  </div>

                  {/* Fast +/- Room Counter */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">Sisa Kamar:</span>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomQuick(prop.id, -1)}
                        disabled={prop.available_rooms <= 0}
                        className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-black text-sm text-slate-900">
                        {prop.available_rooms}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomQuick(prop.id, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center justify-center transition-colors shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Pesanan Terbaru */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <span>Pesanan Terbaru</span>
            </h2>
            <Link
              href="/partner/dashboard/bookings"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Lihat Semua
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">Belum ada pesanan masuk.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{booking.student_name}</p>
                      <a
                        href={`https://wa.me/${booking.student_whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{booking.student_whatsapp}</span>
                      </a>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        booking.status === "PAID"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "APPROVED" || booking.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : booking.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {booking.status === "PAID"
                        ? "Sudah Bayar DP"
                        : booking.status === "PENDING"
                        ? "Menunggu Bayar"
                        : booking.status === "APPROVED" || booking.status === "ACCEPTED"
                        ? "Disetujui"
                        : "Ditolak"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-semibold text-slate-800">{booking.property.name}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Masuk:{" "}
                        {new Date(booking.move_in_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {(booking.status === "PENDING" || booking.status === "PAID") && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingStatus(booking.id, "APPROVED")}
                        disabled={actionLoadingId === booking.id}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoadingId === booking.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingStatus(booking.id, "REJECTED")}
                        disabled={actionLoadingId === booking.id}
                        className="py-1.5 px-3 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
