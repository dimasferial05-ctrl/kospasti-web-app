"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  Eye,
  EyeOff,
  Search,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building,
  User,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface AdminReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  is_hidden: boolean;
  created_at: string;
  property?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  booking?: {
    id: string;
    status: string;
    move_in_date: string;
  };
}

function AdminReviewAvatar({
  src,
  name,
}: {
  src?: string | null;
  name?: string | null;
}) {
  const [hasError, setHasError] = useState(false);
  const initial = (name || "P").trim().charAt(0).toUpperCase();

  if (!src || hasError) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0 border border-slate-200 select-none">
        <span className="uppercase">{initial || "U"}</span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={name || "Foto Profil"}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setHasError(true)}
      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
    />
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLIC" | "HIDDEN">("ALL");
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data || []);
      } else {
        setError(data.error || "Gagal mengambil data ulasan");
      }
    } catch (err) {
      console.error("Gagal mengambil review admin:", err);
      setError("Terjadi kesalahan koneksi server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleHide = async (review: AdminReviewItem) => {
    try {
      setUpdatingId(review.id);
      setActionSuccess(null);
      const newStatus = !review.is_hidden;

      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_hidden: newStatus }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, is_hidden: newStatus } : r))
        );
        setActionSuccess(
          newStatus
            ? `Ulasan dari ${review.user?.name || "Pengguna"} berhasil disembunyikan.`
            : `Ulasan dari ${review.user?.name || "Pengguna"} berhasil ditampilkan ke publik.`
        );
      } else {
        setError(data.error || "Gagal memperbarui status ulasan");
      }
    } catch (err) {
      console.error("Gagal toggle status ulasan:", err);
      setError("Terjadi kesalahan jaringan saat update status ulasan");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        !searchQuery ||
        r.property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        filterStatus === "ALL" ||
        (filterStatus === "PUBLIC" && !r.is_hidden) ||
        (filterStatus === "HIDDEN" && r.is_hidden);

      const matchRating =
        filterRating === "ALL" || r.rating === filterRating;

      return matchSearch && matchStatus && matchRating;
    });
  }, [reviews, searchQuery, filterStatus, filterRating]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const publicCount = reviews.filter((r) => !r.is_hidden).length;
    const hiddenCount = reviews.filter((r) => r.is_hidden).length;
    const avg =
      total > 0
        ? Number(
            (
              reviews.reduce((acc, r) => acc + r.rating, 0) / total
            ).toFixed(1)
          )
        : 0;

    return { total, publicCount, hiddenCount, avg };
  }, [reviews]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
            Moderasi Ulasan Kos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau ulasan dari penyewa terverifikasi dan kelola visibilitas ulasan publik.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-2xs transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          Segarkan Data
        </button>
      </div>

      {/* Alert Messages */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Tutup
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ulasan</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Tampil Publik</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">{stats.publicCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Disembunyikan</p>
          <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1">{stats.hiddenCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Rata-rata Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.avg}</span>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kos, user, email, isi..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter:
          </span>

          {/* Status Tabs */}
          {(["ALL", "PUBLIC", "HIDDEN"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                filterStatus === st
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" && "Semua"}
              {st === "PUBLIC" && "Publik"}
              {st === "HIDDEN" && "Disembunyikan"}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* Rating Dropdown */}
          <select
            value={filterRating}
            onChange={(e) =>
              setFilterRating(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
            }
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">Semua Rating</option>
            <option value="5">5 Bintang</option>
            <option value="4">4 Bintang</option>
            <option value="3">3 Bintang</option>
            <option value="2">2 Bintang</option>
            <option value="1">1 Bintang</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-sm">Memuat data ulasan...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-14 px-4">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-700">Tidak Ada Ulasan Ditemukan</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada data ulasan yang cocok dengan kriteria pencarian dan filter Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Kos / Properti</th>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Ulasan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredReviews.map((r) => {
                  const formattedDate = new Date(r.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/kos/${r.property?.id}`}
                          target="_blank"
                          className="font-bold text-slate-900 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{r.property?.name || "Kos"}</span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <AdminReviewAvatar src={r.user?.avatar} name={r.user?.name} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-xs truncate max-w-[140px]">
                              {r.user?.name || "Penyewa"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {r.user?.email || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900 text-xs">{r.rating}</span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= r.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-700 max-w-xs">
                        {r.comment ? (
                          <p className="line-clamp-2">{r.comment}</p>
                        ) : (
                          <span className="text-slate-400 italic">Hanya memberi rating</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {r.is_hidden ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <EyeOff className="w-3 h-3" />
                            Disembunyikan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Eye className="w-3 h-3" />
                            Publik
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleHide(r)}
                          disabled={updatingId === r.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95 ${
                            r.is_hidden
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {updatingId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : r.is_hidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Tampilkan
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Sembunyikan
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
