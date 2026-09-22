"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  DoorOpen,
  Activity,
  Loader2,
  Calendar,
  Link2,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface AdminStats {
  properties: number;
  rooms: number;
  bookings: number;
  today_bookings?: number;
  recent_bookings: Array<{
    id: string;
    student_name: string;
    move_in_date: string;
    status: string;
    created_at?: string;
    property: { name: string };
  }>;
  recent_magic_links: Array<{
    id: string;
    type?: string;
    is_used: boolean;
    created_at: string;
    expires_at: string;
    owner: { name: string };
  }>;
}

const ITEMS_PER_PAGE = 5;

export default function AdminDashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    properties: 0,
    rooms: 0,
    bookings: 0,
    today_bookings: 0,
    recent_bookings: [],
    recent_magic_links: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [bookingPage, setBookingPage] = useState(1);
  const [magicPage, setMagicPage] = useState(1);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch((err) => {
        console.error("Fetch stats error:", err);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 font-medium flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Mengumpulkan data statistik...</span>
      </div>
    );
  }

  // Pagination calculations
  const totalBookingPages = Math.max(1, Math.ceil(stats.recent_bookings.length / ITEMS_PER_PAGE));
  const paginatedBookings = stats.recent_bookings.slice(
    (bookingPage - 1) * ITEMS_PER_PAGE,
    bookingPage * ITEMS_PER_PAGE
  );

  const totalMagicPages = Math.max(1, Math.ceil(stats.recent_magic_links.length / ITEMS_PER_PAGE));
  const paginatedMagicLinks = stats.recent_magic_links.slice(
    (magicPage - 1) * ITEMS_PER_PAGE,
    magicPage * ITEMS_PER_PAGE
  );

  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Overview Dasbor</h2>
          <p className="text-slate-500 text-sm">
            Ringkasan performa kos dan aktivitas pesanan harian terkini.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 self-start sm:self-auto">
          <Calendar size={14} className="text-slate-500" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Grid Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kartu 1: Total Properti */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-blue-300 transition-colors">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Building size={28} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Properti
            </div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {stats.properties}{" "}
              <span className="text-xs font-semibold text-slate-400">Kos Terdaftar</span>
            </div>
          </div>
        </div>

        {/* Kartu 2: Kamar Tersedia */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-colors">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <DoorOpen size={28} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kamar Tersedia
            </div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {stats.rooms}{" "}
              <span className="text-xs font-semibold text-slate-400">Kamar Kosong</span>
            </div>
          </div>
        </div>

        {/* Kartu 3: Booking Masuk Hari Ini (Aktivitas Harian) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-purple-300 transition-colors">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Activity size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Booking Hari Ini</span>
              <span className="inline-flex items-center px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] rounded font-bold">
                Reset Harian
              </span>
            </div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {stats.today_bookings ?? 0}{" "}
              <span className="text-xs font-semibold text-slate-400">Pesanan</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Total keseluruhan: <span className="font-semibold text-slate-600">{stats.bookings}</span> pesanan
            </div>
          </div>
        </div>
      </div>

      {/* Grid Tabel Data Terkini dengan Pagination */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Tabel 1: Booking Terbaru */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-base">Booking Terbaru</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-md">
              {stats.recent_bookings.length} Riwayat
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {paginatedBookings.length > 0 ? (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nama / Kos</th>
                    <th className="px-4 py-3 font-semibold text-center">Tgl Masuk</th>
                    <th className="px-4 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{b.student_name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]" title={b.property.name}>
                          {b.property.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 text-xs">
                        {new Date(b.move_in_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            b.status === "PAID"
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : b.status === "PENDING"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : b.status === "ACCEPTED" || b.status === "SUCCESS" || b.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : b.status === "REJECTED"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm">Belum ada booking terbaru</p>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {stats.recent_bookings.length > 0 && (
            <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                Halaman <span className="font-bold text-slate-800">{bookingPage}</span> dari{" "}
                <span className="font-bold text-slate-800">{totalBookingPages}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                  disabled={bookingPage <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium cursor-pointer shadow-2xs"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))}
                  disabled={bookingPage >= totalBookingPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium cursor-pointer shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabel 2: Aktivitas Magic Link */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">Aktivitas Magic Link</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-md">
              {stats.recent_magic_links.length} Riwayat
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {paginatedMagicLinks.length > 0 ? (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Pemilik</th>
                    <th className="px-4 py-3 font-semibold text-center">Dibuat Pada</th>
                    <th className="px-4 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMagicLinks.map((ml) => {
                    const isExpired = new Date() > new Date(ml.expires_at);
                    return (
                      <tr key={ml.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate max-w-[130px]" title={ml.owner.name}>
                              {ml.owner.name}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                              {ml.type === "BOOKING_VERIFICATION" ? (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200/60">
                                  Verifikasi Booking
                                </span>
                              ) : (
                                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-200/60">
                                  Update Stok
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 text-xs">
                          {new Date(ml.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right flex justify-end">
                          {ml.is_used ? (
                            <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Terpakai
                            </div>
                          ) : isExpired ? (
                            <div className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" /> Kadaluarsa
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">
                              <Clock className="w-3.5 h-3.5" /> Menunggu
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm">Belum ada aktivitas Magic Link</p>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {stats.recent_magic_links.length > 0 && (
            <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                Halaman <span className="font-bold text-slate-800">{magicPage}</span> dari{" "}
                <span className="font-bold text-slate-800">{totalMagicPages}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMagicPage((p) => Math.max(1, p - 1))}
                  disabled={magicPage <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium cursor-pointer shadow-2xs"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMagicPage((p) => Math.min(totalMagicPages, p + 1))}
                  disabled={magicPage >= totalMagicPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium cursor-pointer shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
