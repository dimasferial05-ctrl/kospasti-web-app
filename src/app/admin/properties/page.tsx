"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, CheckCircle2, Loader2 } from "lucide-react";

interface PropertyAdminItem {
  id: string;
  name: string;
  available_rooms: number;
  owner?: {
    name: string;
    whatsapp_number: string;
  } | null;
}

export default function ManagePropertiesPage() {
  const [properties, setProperties] = useState<PropertyAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/properties")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProperties(data.data);
        }
      })
      .catch((err) => {
        console.error("Fetch properties error:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Fungsi untuk membuat dan menyalin Magic Link
  const handleCopyLink = (propertyId: string) => {
    // Asumsi format Magic Link mengarah ke rute /update/[token_atau_id]
    const magicLink = `${window.location.origin}/update/${propertyId}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(magicLink).then(() => {
        setCopiedId(propertyId);
        setTimeout(() => setCopiedId(null), 2000); // Reset notifikasi setelah 2 detik
      });
    } else {
      setCopiedId(propertyId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Render Loading...
  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Memuat data properti...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Daftar Kos &amp; Manajemen Link
          </h2>
          <p className="text-sm text-slate-500">
            Kelola properti terdaftar dan kirimkan magic link update kamar ke pemilik kos.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-200">Nama Kos</th>
              <th className="p-4 border-b border-slate-200">Nama Pemilik</th>
              <th className="p-4 border-b border-slate-200 text-center">
                Kapasitas (Sisa)
              </th>
              <th className="p-4 border-b border-slate-200 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.map((prop) => (
              <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-800">{prop.name}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-700">
                    {prop.owner?.name || "-"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {prop.owner?.whatsapp_number || "-"}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      prop.available_rooms > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {prop.available_rooms} Kamar
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleCopyLink(prop.id)}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedId === prop.id ? (
                      <>
                        <CheckCircle2 className="text-green-400" size={14} />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Belum ada data kos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
