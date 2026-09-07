"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Download } from "lucide-react";
import { formatBookingsToCSV } from "@/lib/csv-export";

interface BookingAdminItem {
  id: string;
  student_name: string;
  student_whatsapp?: string;
  whatsapp_number?: string;
  move_in_date: string;
  status: string;
  created_at?: string;
  property?: {
    name: string;
  } | null;
}

export default function ManageBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBookings = () => {
    fetch("/api/admin/bookings")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          setBookings(data.data);
        }
      })
      .catch((err) => {
        console.error("Fetch bookings error:", err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleExportCSV = async () => {
    if (bookings.length === 0) {
      alert("Belum ada data riwayat transaksi untuk diekspor.");
      return;
    }

    try {
      setIsExporting(true);
      // Small timeout to allow spinner to render smoothly
      await new Promise((resolve) => setTimeout(resolve, 200));

      const csvContent = formatBookingsToCSV(bookings);
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_KosPasti_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal mengekspor CSV:", err);
      alert("Terjadi kesalahan saat mengekspor data ke format CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingId(bookingId);
      setErrorMessage(null);

      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const result = await res.json();
      if (res.ok && result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      } else {
        alert(result.error || "Gagal memperbarui status transaksi.");
      }
    } catch (err) {
      console.error("Gagal mengupdate status booking:", err);
      alert("Terjadi kesalahan jaringan saat memperbarui status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper untuk merender warna Status (Badge)
  const renderStatusBadge = (status: string) => {
    if (status === "SUCCESS" || status === "CONFIRMED") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">
          SUCCESS
        </span>
      );
    }
    if (status === "PENDING") {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold">
          PENDING
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-bold">
          REJECTED
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Memuat riwayat transaksi...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Riwayat Booking Mahasiswa</h2>
          <p className="text-sm text-slate-500">
            Pantau transaksi pemesanan kamar secara real-time.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting || bookings.length === 0}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer"
          title="Unduh laporan riwayat booking ke format CSV"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <Download className="w-4 h-4 text-slate-600" />
          )}
          <span>{isExporting ? "Mengekspor..." : "Export CSV"}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-200">ID Transaksi</th>
              <th className="p-4 border-b border-slate-200">Nama Mahasiswa</th>
              <th className="p-4 border-b border-slate-200">Nama Kos</th>
              <th className="p-4 border-b border-slate-200 text-center">Tgl Masuk</th>
              <th className="p-4 border-b border-slate-200 text-center">Status</th>
              <th className="p-4 border-b border-slate-200 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => {
              const isPending = booking.status === "PENDING";
              const isCurrentUpdating = updatingId === booking.id;

              return (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {booking.id.split("-")[0]}... {/* Menampilkan potongan awal ID agar rapi */}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{booking.student_name}</div>
                    <div className="text-xs text-slate-500">
                      {booking.student_whatsapp || booking.whatsapp_number}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">
                    {booking.property?.name || "-"}
                  </td>
                  <td className="p-4 text-center text-slate-600">
                    {new Date(booking.move_in_date).toLocaleDateString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    {renderStatusBadge(booking.status)}
                  </td>
                  <td className="p-4 text-center">
                    {isPending ? (
                      <div className="flex items-center justify-center gap-1.5">
                        {isCurrentUpdating ? (
                          <div className="flex items-center gap-1 text-xs text-slate-500 py-1">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                            <span>Memproses...</span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(booking.id, "SUCCESS")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                              title="Setujui / Konfirmasi Booking"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Setujui</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(booking.id, "REJECTED")}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                              title="Tolak Booking"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Tolak</span>
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Belum ada riwayat transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
