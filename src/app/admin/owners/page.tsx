"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, MessageSquare, Loader2, Building2, Calendar } from "lucide-react";

interface OwnerItem {
  id: string;
  name: string;
  whatsapp_number: string;
  created_at: string;
  _count?: {
    properties: number;
  };
  properties?: Array<{
    id: string;
    name: string;
  }>;
}

export default function AdminOwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<OwnerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("adminAuth") : "";

    fetch("/api/admin/owners", {
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("adminAuth");
          }
          router.push("/admin");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          setOwners(data.data);
        }
      })
      .catch((err) => {
        console.error("Fetch owners error:", err);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  // Client-side filtering
  const filteredOwners = useMemo(() => {
    if (!searchQuery.trim()) return owners;
    const query = searchQuery.toLowerCase();
    return owners.filter(
      (owner) =>
        owner.name.toLowerCase().includes(query) ||
        owner.whatsapp_number.toLowerCase().includes(query)
    );
  }, [owners, searchQuery]);

  const formatWhatsAppNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return cleaned;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Memuat data pemilik kos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-slate-800" />
            <span>Manajemen Pemilik Kos</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar seluruh pemilik kos (Ibu/Bapak Kos) yang terdaftar di platform KosPasti.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama atau WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Owners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total {filteredOwners.length} Pemilik Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200">Nama Pemilik</th>
                <th className="p-4 border-b border-slate-200">Nomor WhatsApp</th>
                <th className="p-4 border-b border-slate-200 text-center">Jumlah Properti</th>
                <th className="p-4 border-b border-slate-200">Tanggal Terdaftar</th>
                <th className="p-4 border-b border-slate-200 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOwners.map((owner) => {
                const propertyCount =
                  owner._count?.properties ?? owner.properties?.length ?? 0;

                return (
                  <tr key={owner.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{owner.name}</div>
                      {owner.properties && owner.properties.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {owner.properties.map((p) => p.name).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700 font-mono text-xs">
                        {owner.whatsapp_number}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {propertyCount} Kos
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(owner.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={`https://wa.me/${formatWhatsAppNumber(owner.whatsapp_number)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        title="Hubungi via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chat WA</span>
                      </a>
                    </td>
                  </tr>
                );
              })}

              {filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {searchQuery
                      ? `Tidak ditemukan pemilik kos dengan kata kunci "${searchQuery}".`
                      : "Belum ada data pemilik kos terdaftar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
