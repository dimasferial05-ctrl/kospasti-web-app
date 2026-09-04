"use client";

import { useState, useEffect } from "react";
import { Building, DoorOpen, Activity, Loader2 } from "lucide-react";

interface AdminStats {
  properties: number;
  rooms: number;
  bookings: number;
}

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<AdminStats>({
    properties: 0,
    rooms: 0,
    bookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("adminAuth") : "";
    fetch("/api/admin/stats", {
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
        if (data && data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch((err) => {
        console.error("Fetch stats error:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 font-medium flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Mengumpulkan data statistik...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Overview Dasbor</h2>
        <p className="text-slate-500">
          Ringkasan performa kos dan aktivitas pesanan terkini.
        </p>
      </div>

      {/* Grid Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kartu 1: Total Properti */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
            <Building size={32} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Total Properti
            </div>
            <div className="text-3xl font-extrabold text-slate-800">
              {stats.properties}{" "}
              <span className="text-sm font-medium text-slate-500">Kos</span>
            </div>
          </div>
        </div>

        {/* Kartu 2: Kamar Tersedia */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-lg">
            <DoorOpen size={32} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Kamar Tersedia
            </div>
            <div className="text-3xl font-extrabold text-slate-800">
              {stats.rooms}{" "}
              <span className="text-sm font-medium text-slate-500">Kamar</span>
            </div>
          </div>
        </div>

        {/* Kartu 3: Booking Masuk */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-lg">
            <Activity size={32} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Booking Masuk
            </div>
            <div className="text-3xl font-extrabold text-slate-800">
              {stats.bookings}{" "}
              <span className="text-sm font-medium text-slate-500">Pesanan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tambahan Kosong untuk Ruang Ekspansi Masa Depan */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mt-6 min-h-[300px] flex items-center justify-center">
        <p className="text-slate-400 text-sm font-medium">
          Area ini disiapkan untuk grafik analitik di masa mendatang (Epic Selanjutnya).
        </p>
      </div>
    </div>
  );
}
