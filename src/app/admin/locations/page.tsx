"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building,
  GraduationCap,
  Hospital,
  Factory,
  Globe,
  SlidersHorizontal,
  X,
  Copy,
  Check,
} from "lucide-react";
import LocationPicker from "@/components/map/LocationPicker";

interface LocationItem {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  aliases: string | null;
  subdistrict: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface GlobalStats {
  totalGlobal: number;
  activeTotal: number;
  educationTotal: number;
}

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "Semua Kategori", icon: Globe },
  { value: "kampus", label: "Kampus / Universitas", icon: GraduationCap },
  { value: "sekolah", label: "Sekolah (SMA/SMK/SMP)", icon: GraduationCap },
  { value: "rumah_sakit", label: "Rumah Sakit / Faskes", icon: Hospital },
  { value: "pabrik", label: "Industri / Pabrik", icon: Factory },
  { value: "landmark", label: "Landmark / Titik Populer", icon: MapPin },
  { value: "wilayah", label: "Wilayah / Kecamatan", icon: Building },
  { value: "kota", label: "Kota", icon: Building },
];

const CATEGORY_STYLE: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  kampus: {
    label: "Kampus",
    icon: "🎓",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
  },
  sekolah: {
    label: "Sekolah",
    icon: "🏫",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/60",
  },
  rumah_sakit: {
    label: "Faskes / RS",
    icon: "🏥",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
  },
  pabrik: {
    label: "Industri",
    icon: "🏭",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  landmark: {
    label: "Landmark",
    icon: "📍",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  wilayah: {
    label: "Wilayah",
    icon: "🗺️",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800/60",
  },
  kota: {
    label: "Kota",
    icon: "🌆",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/60",
  },
};

const DEFAULT_SUBANG_CENTER = { lat: -6.559, lng: 107.7583 };

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalGlobal: 0,
    activeTotal: 0,
    educationTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters & Search with Debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Quick Action States
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("landmark");
  const [formSubdistrict, setFormSubdistrict] = useState("Subang");
  const [formAliases, setFormAliases] = useState("");
  const [formLat, setFormLat] = useState<number>(DEFAULT_SUBANG_CENTER.lat);
  const [formLng, setFormLng] = useState<number>(DEFAULT_SUBANG_CENTER.lng);
  const [formLatStr, setFormLatStr] = useState<string>(DEFAULT_SUBANG_CENTER.lat.toFixed(6));
  const [formLngStr, setFormLngStr] = useState<string>(DEFAULT_SUBANG_CENTER.lng.toFixed(6));
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal States
  const [deleteTarget, setDeleteTarget] = useState<LocationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search Debounce Handler (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Lock Body Scroll when Modal Open
  useEffect(() => {
    if (isModalOpen || deleteTarget) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, deleteTarget]);

  // Fetch Locations
  const fetchLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      params.append("page", currentPage.toString());
      params.append("limit", "20");

      const res = await fetch(`/api/admin/locations?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setLocations(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        if (data.stats) {
          setGlobalStats(data.stats);
        }
      } else {
        setErrorMessage(data.error || "Gagal memuat data lokasi");
      }
    } catch (err) {
      console.error("Error fetch locations:", err);
      setErrorMessage("Terjadi kendala koneksi saat mengambil data lokasi.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedStatus, currentPage]);

  useEffect(() => {
    let ignore = false;
    const executeFetch = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
        if (selectedCategory !== "ALL") params.append("category", selectedCategory);
        if (selectedStatus !== "ALL") params.append("status", selectedStatus);
        params.append("page", currentPage.toString());
        params.append("limit", "20");

        const res = await fetch(`/api/admin/locations?${params.toString()}`);
        const data = await res.json();

        if (!ignore) {
          if (res.ok && data.success) {
            setLocations(data.data || []);
            if (data.pagination) {
              setPagination(data.pagination);
            }
            if (data.stats) {
              setGlobalStats(data.stats);
            }
          } else {
            setErrorMessage(data.error || "Gagal memuat data lokasi");
          }
        }
      } catch (err) {
        console.error("Error fetch locations:", err);
        if (!ignore) {
          setErrorMessage("Terjadi kendala koneksi saat mengambil data lokasi.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void executeFetch();

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, selectedCategory, selectedStatus, currentPage]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Open Form for Add
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName("");
    setFormCategory("landmark");
    setFormSubdistrict("Subang");
    setFormAliases("");
    setFormLat(DEFAULT_SUBANG_CENTER.lat);
    setFormLng(DEFAULT_SUBANG_CENTER.lng);
    setFormLatStr(DEFAULT_SUBANG_CENTER.lat.toFixed(6));
    setFormLngStr(DEFAULT_SUBANG_CENTER.lng.toFixed(6));
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditModal = (item: LocationItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormSubdistrict(item.subdistrict || "Subang");
    setFormAliases(item.aliases || "");
    setFormLat(item.latitude);
    setFormLng(item.longitude);
    setFormLatStr(item.latitude.toString());
    setFormLngStr(item.longitude.toString());
    setFormIsActive(item.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Form (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formName.trim().length < 2) {
      setFormError("Nama lokasi minimal 2 karakter");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload = {
        name: formName.trim(),
        category: formCategory,
        subdistrict: formSubdistrict.trim() || null,
        aliases: formAliases.trim() || null,
        latitude: formLat,
        longitude: formLng,
        is_active: formIsActive,
      };

      const endpoint = isEditing && editingId
        ? `/api/admin/locations/${editingId}`
        : "/api/admin/locations";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsModalOpen(false);
        setSuccessToast(
          isEditing
            ? `Lokasi "${formName}" berhasil diperbarui!`
            : `Lokasi "${formName}" berhasil ditambahkan!`
        );
        fetchLocations();
      } else {
        setFormError(result.error || "Gagal menyimpan data lokasi.");
      }
    } catch (err) {
      console.error("Gagal simpan form lokasi:", err);
      setFormError("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick Status Toggle on Table
  const handleToggleActive = async (item: LocationItem) => {
    try {
      setTogglingId(item.id);
      const newStatus = !item.is_active;

      // Optimistic update
      setLocations((prev) =>
        prev.map((l) => (l.id === item.id ? { ...l, is_active: newStatus } : l))
      );

      const res = await fetch(`/api/admin/locations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback
        setLocations((prev) =>
          prev.map((l) => (l.id === item.id ? { ...l, is_active: !newStatus } : l))
        );
        alert(data.error || "Gagal mengubah status lokasi");
      } else {
        setSuccessToast(
          `Status "${item.name}" diubah ke ${newStatus ? "Aktif" : "Nonaktif"}.`
        );
        setGlobalStats((prev) => ({
          ...prev,
          activeTotal: newStatus ? prev.activeTotal + 1 : Math.max(0, prev.activeTotal - 1),
        }));
      }
    } catch (err) {
      console.error("Gagal toggle active:", err);
      setLocations((prev) =>
        prev.map((l) => (l.id === item.id ? { ...l, is_active: !item.is_active } : l))
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Quick Copy Coordinates
  const handleCopyCoords = (item: LocationItem) => {
    const text = `${item.latitude}, ${item.longitude}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/locations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setDeleteTarget(null);
        setSuccessToast(`Lokasi "${deleteTarget.name}" berhasil dihapus.`);
        fetchLocations();
      } else {
        alert(result.error || "Gagal menghapus lokasi.");
      }
    } catch (err) {
      console.error("Error delete location:", err);
      alert("Terjadi kendala saat menghapus data lokasi.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Notifikasi */}
        {successToast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-float animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{successToast}</span>
            <button
              onClick={() => setSuccessToast(null)}
              className="ml-2 hover:opacity-80 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Kelola Master Lokasi Subang
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Kelola titik koordinat landmark, sekolah, kawasan industri, dan fasilitas publik secara terpusat.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchLocations}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 shadow-soft transition-all duration-200 active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-soft hover:shadow-float hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Lokasi</span>
            </button>
          </div>
        </div>

        {/* Stats Grid - Global Authentic Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-soft flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Master Lokasi
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {(globalStats.totalGlobal || pagination.total).toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Database Terdaftar</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-soft flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sekolah & Kampus
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {(globalStats.educationTotal || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Institusi Pendidikan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-soft flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Lokasi Aktif
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {(globalStats.activeTotal || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Tampil di Search & AI</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-soft flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cakupan Wilayah
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                Kab. Subang
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">30 Kecamatan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-soft space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama tempat, alias, atau kecamatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif Saja</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-300 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchLocations}
              className="text-xs font-bold underline hover:no-underline"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Data Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-4">Nama Tempat & Alias</th>
                  <th scope="col" className="px-4 py-4">Kategori</th>
                  <th scope="col" className="px-4 py-4">Kecamatan</th>
                  <th scope="col" className="px-4 py-4">Koordinat (Lat, Lng)</th>
                  <th scope="col" className="px-4 py-4 text-center">Status</th>
                  <th scope="col" className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-14 mx-auto"></div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-16 ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                          <MapPin className="w-7 h-7" />
                        </div>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                          Tidak ada lokasi ditemukan
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                          Coba ganti kata kunci pencarian atau reset filter kategori untuk melihat hasil lainnya.
                        </p>
                        {(searchQuery || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedCategory("ALL");
                              setSelectedStatus("ALL");
                              setCurrentPage(1);
                            }}
                            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  locations.map((item) => {
                    const badge = CATEGORY_STYLE[item.category] || {
                      label: item.category,
                      icon: "📍",
                      bg: "bg-slate-100 dark:bg-slate-800",
                      text: "text-slate-700 dark:text-slate-300",
                      border: "border-slate-200 dark:border-slate-700",
                    };

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Nama & Aliases */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {item.name}
                          </div>
                          {item.aliases ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.aliases.split(",").map((alias, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
                                >
                                  {alias.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tanpa alias</span>
                          )}
                        </td>

                        {/* Kategori Badge */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Kecamatan */}
                        <td className="px-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {item.subdistrict || "Subang"}
                        </td>

                        {/* Koordinat & Quick Copy */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 hover:underline group"
                              title="Buka di Google Maps"
                            >
                              <span>
                                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyCoords(item)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              title="Salin koordinat"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status Aktif Quick Toggle */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            disabled={togglingId === item.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer hover:shadow-soft ${
                              item.is_active
                                ? "bg-emerald-100/80 hover:bg-emerald-200/80 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                            title="Klik untuk mengubah status aktif/nonaktif secara instan"
                          >
                            {togglingId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : item.is_active ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{item.is_active ? "Aktif" : "Nonaktif"}</span>
                          </button>
                        </td>

                        {/* Tombol Aksi */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-90"
                              title="Edit Lokasi"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="p-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-90"
                              title="Hapus Lokasi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div>
                Menampilkan{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {pagination.total}
                </span>{" "}
                lokasi
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold active:scale-95"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold active:scale-95"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-float max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {isEditing ? "Edit Data Lokasi" : "Tambah Lokasi Baru"}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Lengkapi informasi lokasi dan sesuaikan titik pin pada peta interaktif.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Tempat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nama Lokasi / Tempat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMK PGRI 1 Subang"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Grid: Kategori & Kecamatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.filter((c) => c.value !== "ALL").map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Kecamatan (di Subang)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Subang / Kalijati / Cibogo"
                    value={formSubdistrict}
                    onChange={(e) => setFormSubdistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Aliases / Kata Kunci Alternatif */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Alias / Nama Panggilan Populer
                </label>
                <input
                  type="text"
                  placeholder="Pisahkan dengan koma, contoh: smeri, tubun, smk tubun"
                  value={formAliases}
                  onChange={(e) => setFormAliases(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kata kunci alias membantu sistem pencarian dan AI mengenali sebutan lokal mahasiswa/warga.
                </p>
              </div>

              {/* Interactive LocationPicker Map */}
              <div className="pt-2">
                <LocationPicker
                  latitude={formLat}
                  longitude={formLng}
                  label="Pilih Titik Lokasi pada Peta (Subang)"
                  helperText="Klik pada peta atau geser pin ke posisi yang tepat. Koordinat lat & lng otomatis terisi."
                  height="260px"
                  onChange={(lat, lng) => {
                    setFormLat(lat);
                    setFormLng(lng);
                    setFormLatStr(lat.toFixed(6));
                    setFormLngStr(lng.toFixed(6));
                  }}
                />
              </div>

              {/* Koordinat Display / Free-Typing Manual Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formLatStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormLatStr(val);
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
                        setFormLat(parsed);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formLngStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormLngStr(val);
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
                        setFormLng(parsed);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Status Aktif Toggle */}
              <div className="pt-2 flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Status Lokasi Aktif
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lokasi aktif akan otomatis muncul di pencarian autocomplete & AI search.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-float active:scale-95 transition-all disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isEditing ? "Simpan Perubahan" : "Tambah Lokasi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-float max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Hapus Lokasi Ini?
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus lokasi{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  &quot;{deleteTarget.name}&quot;
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-soft hover:shadow-float active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus Lokasi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
