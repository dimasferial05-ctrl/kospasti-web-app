"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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
  const [bookings, setBookings] = useState<BookingAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("adminAuth") : "";
    fetch("/api/admin/bookings", {
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("adminAuth");
            window.location.reload();
          }
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
  }, []);

  // Helper untuk merender warna Status (Badge)
  const renderStatusBadge = (status: string) => {
    if (status === "SUCCESS") {
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
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">Riwayat Booking Mahasiswa</h2>
        <p className="text-sm text-slate-500">
          Pantau transaksi pemesanan kamar secara real-time.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-200">ID Transaksi</th>
              <th className="p-4 border-b border-slate-200">Nama Mahasiswa</th>
              <th className="p-4 border-b border-slate-200">Nama Kos</th>
              <th className="p-4 border-b border-slate-200 text-center">Tgl Masuk</th>
              <th className="p-4 border-b border-slate-200 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
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
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
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
