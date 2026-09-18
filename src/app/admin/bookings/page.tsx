"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Download, User as UserIcon, MessageCircle, Mail, Phone, Calendar } from "lucide-react";
import { formatBookingsToCSV } from "@/lib/csv-export";

interface BookingAdminUser {
  id?: string;
  name?: string;
  email?: string;
  whatsapp?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

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
  user?: BookingAdminUser | null;
}

function UserAvatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [hasError, setHasError] = useState(false);

  const initial = (name || "M").trim().charAt(0).toUpperCase();

  if (!src || hasError) {
    if (size === "lg") {
      return (
        <div className="w-20 h-20 rounded-full bg-white/20 text-white flex items-center justify-center font-extrabold text-2xl border-4 border-white/80 shadow-md mb-3 select-none">
          {initial || <UserIcon size={36} />}
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none">
        {initial || <UserIcon size={18} />}
      </div>
    );
  }

  if (size === "lg") {
    return (
      <img
        src={src}
        alt={name || "Foto Pemesan"}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className="w-20 h-20 rounded-full object-cover border-4 border-white/80 shadow-md mb-3 shrink-0"
      />
    );
  }

  return (
    <img
      src={src}
      alt={name || "Avatar"}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setHasError(true)}
      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
    />
  );
}

export default function ManageBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<BookingAdminUser | null>(null);

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

  const getCleanWhatsappUrl = (phone?: string | null) => {
    if (!phone) return "#";
    const cleaned = phone.replace(/\D/g, "");
    const formatted = cleaned.startsWith("0") ? "62" + cleaned.slice(1) : cleaned;
    return `https://wa.me/${formatted}`;
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
    <div className="space-y-6">
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
          <table className="w-full text-left text-sm min-w-[800px]">
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
                const displayName = booking.user?.name || booking.student_name;
                const displayWhatsapp = booking.user?.whatsapp || booking.student_whatsapp || booking.whatsapp_number || "-";
                const userAvatar = booking.user?.avatar;

                return (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {booking.id.split("-")[0]}... {/* Menampilkan potongan awal ID agar rapi */}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUser({
                              name: displayName,
                              whatsapp: displayWhatsapp !== "-" ? displayWhatsapp : null,
                              email: booking.user?.email,
                              avatar: userAvatar,
                              bio: booking.user?.bio,
                            })
                          }
                          className="shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full cursor-pointer"
                          title="Lihat detail profil pemesan"
                        >
                          <UserAvatar src={userAvatar} name={displayName} size="md" />
                        </button>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUser({
                                name: displayName,
                                whatsapp: displayWhatsapp !== "-" ? displayWhatsapp : null,
                                email: booking.user?.email,
                                avatar: userAvatar,
                                bio: booking.user?.bio,
                              })
                            }
                            className="text-left font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer block"
                            title="Klik untuk melihat profil lengkap"
                          >
                            {displayName}
                          </button>
                          <div className="text-xs text-slate-500">
                            {displayWhatsapp}
                          </div>
                        </div>
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

      {/* Modal Detail Profil Pemesan */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedUser(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Tutup detail modal"
              >
                <X size={18} />
              </button>
              <div className="flex flex-col items-center text-center">
                <UserAvatar src={selectedUser.avatar} name={selectedUser.name} size="lg" />
                <h3 className="text-xl font-bold tracking-tight">{selectedUser.name || "Pencari Kos"}</h3>
                <p className="text-blue-100 text-xs mt-0.5">Detail Profil Pencari Kos</p>
              </div>
            </div>

            {/* Isi Konten Profil */}
            <div className="p-6 space-y-4">
              {/* Bio Singkat */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Bio / Deskripsi Diri
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 leading-relaxed italic">
                  {selectedUser.bio ? `"${selectedUser.bio}"` : "Pengguna belum menambahkan bio profil."}
                </div>
              </div>

              {/* Data Kontak */}
              <div className="space-y-2.5 pt-2">
                {selectedUser.email && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                    <Mail size={18} className="text-slate-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="text-xs text-slate-400 font-medium">Alamat Email</div>
                      <div className="text-slate-700 font-medium truncate">{selectedUser.email}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Nomor WhatsApp</div>
                      <div className="text-slate-700 font-medium">{selectedUser.whatsapp || "Tidak tersedia"}</div>
                    </div>
                  </div>
                  {selectedUser.whatsapp && (
                    <a
                      href={getCleanWhatsappUrl(selectedUser.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                    >
                      <MessageCircle size={14} />
                      <span>Chat</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Tombol Tutup */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
