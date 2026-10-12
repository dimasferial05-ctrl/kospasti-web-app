"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Download, User as UserIcon, MessageCircle, Mail, Phone, Calendar, CheckCircle2, CreditCard, Copy } from "lucide-react";
import { formatBookingsToCSV, formatFinancialBookingsToCSV } from "@/lib/csv-export";

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
  cancellation_reason?: string | null;
  refund_bank_name?: string | null;
  refund_account_number?: string | null;
  refund_account_holder?: string | null;
  refund_note?: string | null;
  refunded_at?: string | null;
  property?: {
    name: string;
    price_per_month?: number;
    owner?: {
      name: string;
      whatsapp_number?: string;
    } | null;
  } | null;
  room_type?: {
    name: string;
    price_per_month: number;
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<BookingAdminUser | null>(null);

  // Escrow Admin Refund Modal State
  const [refundingBooking, setRefundingBooking] = useState<BookingAdminItem | null>(null);
  const [refundNoteInput, setRefundNoteInput] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

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

      const exportData = bookings.map((b) => ({
        id: b.id,
        student_name: b.student_name,
        student_whatsapp: b.student_whatsapp,
        whatsapp_number: b.whatsapp_number,
        move_in_date: b.move_in_date,
        status: b.status,
        created_at: b.created_at,
        amount: b.room_type?.price_per_month ?? b.property?.price_per_month ?? 0,
        cancellation_reason: b.cancellation_reason,
        refund_note: b.refund_note,
        property: b.property
          ? {
              name: b.property.name,
              owner: b.property.owner,
            }
          : null,
        room_type: b.room_type,
      }));

      const csvContent = formatFinancialBookingsToCSV(exportData, { includeOwner: true });
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

  const handleConfirmAdminRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingBooking) return;

    try {
      setIsSubmittingRefund(true);
      setErrorMessage(null);

      const res = await fetch(`/api/admin/bookings/${refundingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REFUNDED",
          refund_note: refundNoteInput.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const result = await res.json();
      if (res.ok && result.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === refundingBooking.id
              ? {
                  ...b,
                  status: "REFUNDED",
                  refund_note: refundNoteInput.trim() || b.refund_note,
                  refunded_at: new Date().toISOString(),
                }
              : b
          )
        );
        setSuccessMessage("Pengembalian dana (refund) berhasil dicairkan! Mahasiswa telah menerima notifikasi WhatsApp resmi.");
        setTimeout(() => setSuccessMessage(null), 4000);
        setRefundingBooking(null);
        setRefundNoteInput("");
      } else {
        alert(result.error || "Gagal memproses pengembalian dana.");
      }
    } catch (err) {
      console.error("Gagal memproses refund admin:", err);
      alert("Terjadi kesalahan jaringan saat memproses refund.");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // Helper untuk merender warna Status (Badge)
  const renderStatusBadge = (status: string) => {
    const upper = (status || "").toUpperCase();
    if (upper === "PAID") {
      return (
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-md text-xs font-bold border border-blue-200 dark:border-blue-800">
          PAID
        </span>
      );
    }
    if (status === "SUCCESS" || upper === "SUCCESS" || upper === "CONFIRMED" || upper === "ACCEPTED" || upper === "APPROVED") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 rounded-md text-xs font-bold border border-green-200 dark:border-green-800">
          {status}
        </span>
      );
    }
    if (status === "PENDING" || upper === "PENDING") {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300 rounded-md text-xs font-bold border border-yellow-200 dark:border-yellow-800">
          PENDING
        </span>
      );
    }
    if (upper === "REFUND_REQUESTED") {
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded-md text-xs font-bold border border-amber-300 dark:border-amber-800">
          REFUND_REQUESTED
        </span>
      );
    }
    if (upper === "REFUNDED") {
      return (
        <span className="px-2 py-1 bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 rounded-md text-xs font-bold border border-sky-300 dark:border-sky-800">
          REFUNDED
        </span>
      );
    }
    if (upper === "CANCELLED") {
      return (
        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700">
          CANCELLED
        </span>
      );
    }
    if (status === "REJECTED" || upper === "REJECTED") {
      return (
        <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-md text-xs font-bold border border-rose-200 dark:border-rose-800">
          REJECTED
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700">
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
      <div className="p-8 text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Memuat riwayat transaksi...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Booking Mahasiswa</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pantau transaksi pemesanan kamar secara real-time.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || bookings.length === 0}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer"
            title="Unduh laporan riwayat booking ke format CSV"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-400" />
            ) : (
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            )}
            <span>{isExporting ? "Mengekspor..." : "Export CSV"}</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">ID Transaksi</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Nama Mahasiswa</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Nama Kos</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Tgl Masuk</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Status</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {bookings.map((booking) => {
                const isPending = booking.status === "PENDING";
                const isCurrentUpdating = updatingId === booking.id;
                const displayName = booking.user?.name || booking.student_name;
                const displayWhatsapp = booking.user?.whatsapp || booking.student_whatsapp || booking.whatsapp_number || "-";
                const userAvatar = booking.user?.avatar;

                return (
                  <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
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
                            className="text-left font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer block"
                            title="Klik untuk melihat profil lengkap"
                          >
                            {displayName}
                          </button>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {displayWhatsapp}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {booking.property?.name || "-"}
                      </div>
                      {booking.cancellation_reason && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 line-clamp-1" title={booking.cancellation_reason}>
                          Alasan: {booking.cancellation_reason}
                        </div>
                      )}
                      {booking.refund_bank_name && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          Refund: {booking.refund_bank_name} {booking.refund_account_number} ({booking.refund_account_holder})
                        </div>
                      )}
                      {booking.refund_note && (
                        <div className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5">
                          Ref: {booking.refund_note}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">
                      {new Date(booking.move_in_date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="p-4 text-center">
                      {renderStatusBadge(booking.status)}
                    </td>
                    <td className="p-4 text-center">
                      {isPending ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {isCurrentUpdating ? (
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 py-1">
                              <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-400" />
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
                                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-md text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                                title="Tolak Booking"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}
                        </div>
                      ) : booking.status === "REFUND_REQUESTED" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {isCurrentUpdating ? (
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 py-1">
                              <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-400" />
                              <span>Memproses...</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundingBooking(booking);
                                setRefundNoteInput("");
                                setCopiedAccount(false);
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                              title="Proses Pengembalian Dana (Escrow KosPasti)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Proses Refund</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
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
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden animate-scaleUp"
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Bio / Deskripsi Diri
                </label>
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  {selectedUser.bio ? `"${selectedUser.bio}"` : "Pengguna belum menambahkan bio profil."}
                </div>
              </div>

              {/* Data Kontak */}
              <div className="space-y-2.5 pt-2">
                {selectedUser.email && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/60 text-sm">
                    <Mail size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Alamat Email</div>
                      <div className="text-slate-700 dark:text-slate-200 font-medium truncate">{selectedUser.email}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/60 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Nomor WhatsApp</div>
                      <div className="text-slate-700 dark:text-slate-200 font-medium">{selectedUser.whatsapp || "Tidak tersedia"}</div>
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
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proses Refund Escrow Admin */}
      {refundingBooking && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setRefundingBooking(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-float border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setRefundingBooking(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Tutup modal refund"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-black text-xl shadow-inner">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Proses Pengembalian Dana (Escrow)</h3>
                  <p className="text-amber-100 text-xs">Pencairan dana tertahan platform KosPasti ke penyewa</p>
                </div>
              </div>
            </div>

            {/* Isi Konten Modal */}
            <form onSubmit={handleConfirmAdminRefund} className="p-6 space-y-4 text-xs">
              {/* Info Ringkasan */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Mahasiswa Pemesan</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {refundingBooking.user?.name || refundingBooking.student_name}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Kos & Tipe Kamar</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                    {refundingBooking.property?.name || "Kos"}
                  </span>
                </div>
              </div>

              {/* Rekening Tujuan Transfer */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-200">Rekening Tujuan Refund:</span>
                  <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60">
                    {refundingBooking.refund_bank_name || "Bank Transfer"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Nomor Rekening / Akun</div>
                    <div className="font-mono text-base font-black text-slate-900 dark:text-white tracking-wider">
                      {refundingBooking.refund_account_number || "-"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                      a.n. <strong className="text-slate-900 dark:text-white">{refundingBooking.refund_account_holder || "-"}</strong>
                    </div>
                  </div>

                  {refundingBooking.refund_account_number && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(refundingBooking.refund_account_number || "");
                        setCopiedAccount(true);
                        setTimeout(() => setCopiedAccount(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Salin nomor rekening"
                    >
                      {copiedAccount ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {refundingBooking.cancellation_reason && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] pt-1">
                    <strong>Alasan Pembatalan:</strong> {refundingBooking.cancellation_reason}
                  </p>
                )}
              </div>

              {/* Form Input Catatan Transfer */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Catatan / No. Referensi Transfer Admin (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer Escrow BCA ref #891238 / QRIS refund"
                  value={refundNoteInput}
                  onChange={(e) => setRefundNoteInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Catatan dan nomor referensi ini akan dikirimkan otomatis via notifikasi WhatsApp resmi ke mahasiswa.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRefundingBooking(null)}
                  disabled={isSubmittingRefund}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-soft transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingRefund ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses Refund...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi Telah Ditransfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
