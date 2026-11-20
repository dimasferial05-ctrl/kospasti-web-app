"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  BedDouble,
  PawPrint,
  MapPin,
  Loader2,
  CheckCircle2,
  X,
  Info,
  ExternalLink,
  FileText,
  Star,
  Play,
  Clock,
  Home,
  AlertCircle,
  Award,
} from "lucide-react";
import LocationPicker from "@/components/map/LocationPicker";
import { PropertyModalForm } from "@/components/forms/property/PropertyModalForm";

interface PropertyMediaItem {
  id: string;
  url: string;
  type: string;
}

interface RoomTypeItem {
  id?: string;
  name: string;
  price_per_month: number | string;
  security_deposit?: number | string;
  available_rooms: number | string;
  facilities?: string | null;
  specifications?: string | null;
  image_url?: string | null;
  image_file?: File | null;
  image_preview?: string | null;
}

interface Property {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  gender_type: string;
  price_per_month: number;
  available_rooms: number;
  facilities: string;
  description: string | null;
  rules: string | null;
  rental_terms: string | null;
  youtube_url: string | null;
  image_url: string | null;
  is_pet_friendly: boolean;
  is_24_hours: boolean;
  status: string;
  is_featured?: boolean;
  featured_until?: string | null;
  rejectionReason?: string | null;
  created_at: string;
  media?: PropertyMediaItem[];
  room_types?: RoomTypeItem[];
  _count?: {
    bookings: number;
    reviews: number;
  };
}

interface PropertyFormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  gender_type: string;
  price_per_month: string;
  available_rooms: string;
  facilities: string;
  description: string;
  rules: string;
  rental_terms: string;
  youtube_url: string;
  image_url: string;
  is_pet_friendly: boolean;
  is_24_hours: boolean;
}

const initialFormData: PropertyFormData = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  gender_type: "CAMPUR",
  price_per_month: "",
  available_rooms: "5",
  facilities: "WiFi, Kasur, Lemari, AC, Kamar Mandi Dalam",
  description: "",
  rules: "1. Menjaga kebersihan bersama\n2. Tamu dilarang menginap tanpa izin\n3. Waktu tenang pukul 22:00 WIB",
  rental_terms: "1. Fotokopi KTP / KTM\n2. Uang muka sewa bulan pertama\n3. Deposit jaminan Rp 150.000",
  youtube_url: "",
  image_url: "",
  is_pet_friendly: false,
  is_24_hours: true,
};

export default function PartnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalMode, setModalMode] = useState<"NEW" | "EDIT" | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [promotingProperty, setPromotingProperty] = useState<Property | null>(null);
  const [promoteDurationDays, setPromoteDurationDays] = useState<number>(30);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [settingThumbnailUrl, setSettingThumbnailUrl] = useState<string | null>(null);

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCoordHelp, setShowCoordHelp] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/partner/properties");
      const data = await res.json();
      if (data.success) {
        setProperties(data.properties || []);
      } else {
        setErrorMsg(data.error || "Gagal memuat properti.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProperties();
  }, [fetchProperties]);

  const openNewModal = () => {
    setFormData(initialFormData);
    setRoomTypes([
      {
        name: "Tipe A (Standar)",
        price_per_month: "850000",
        security_deposit: "250000",
        available_rooms: "5",
        facilities: "Kasur, Lemari, WiFi, Kamar Mandi Dalam",
        specifications: "Ukuran 3x4 meter, ventilasi jendela luas, listrik token mandiri",
        image_url: "",
        image_file: null,
        image_preview: null,
      },
    ]);
    setSelectedFiles([]);
    setEditingProperty(null);
    setModalMode("NEW");
    setErrorMsg(null);
    setActionError(null);
  };

  const openEditModal = (prop: Property) => {
    setEditingProperty(prop);
    setFormData({
      name: prop.name || "",
      address: prop.address || "",
      latitude: prop.latitude !== null ? String(prop.latitude) : "",
      longitude: prop.longitude !== null ? String(prop.longitude) : "",
      gender_type: prop.gender_type || "CAMPUR",
      price_per_month: String(prop.price_per_month || ""),
      available_rooms: String(prop.available_rooms || "0"),
      facilities: prop.facilities || "",
      description: prop.description || "",
      rules: prop.rules || "",
      rental_terms: prop.rental_terms || "",
      youtube_url: prop.youtube_url || "",
      image_url: prop.image_url && !prop.image_url.startsWith("/uploads/") && !prop.image_url.includes("images.unsplash.com") ? prop.image_url : "",
      is_pet_friendly: Boolean(prop.is_pet_friendly),
      is_24_hours: Boolean(prop.is_24_hours),
    });

    if (prop.room_types && prop.room_types.length > 0) {
      setRoomTypes(
        prop.room_types.map((rt) => ({
          id: rt.id,
          name: rt.name,
          price_per_month: String(rt.price_per_month),
          security_deposit: String((rt as any).security_deposit || "0"),
          available_rooms: String(rt.available_rooms),
          facilities: rt.facilities || "",
          specifications: rt.specifications || "",
          image_url: rt.image_url || "",
          image_file: null,
          image_preview: rt.image_url || null,
        }))
      );
    } else {
      setRoomTypes([
        {
          name: "Standar",
          price_per_month: String(prop.price_per_month || ""),
          available_rooms: String(prop.available_rooms || "0"),
          facilities: prop.facilities || "",
          specifications: "",
          image_url: "",
          image_file: null,
          image_preview: null,
        },
      ]);
    }

    setSelectedFiles([]);
    setModalMode("EDIT");
    setErrorMsg(null);
    setActionError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingProperty(null);
    setSelectedFiles([]);
    setActionError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Tipe Kamar Handlers
  const addRoomType = () => {
    setRoomTypes((prev) => [
      ...prev,
      {
        name: `Tipe ${String.fromCharCode(65 + prev.length)}`,
        price_per_month: formData.price_per_month || "850000",
        available_rooms: "1",
        facilities: formData.facilities,
        specifications: "",
        image_url: "",
        image_file: null,
        image_preview: null,
      },
    ]);
  };

  const removeRoomType = (index: number) => {
    if (roomTypes.length <= 1) {
      setActionError("Properti wajib memiliki minimal 1 tipe kamar.");
      return;
    }
    setRoomTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRoomType = (index: number, field: keyof RoomTypeItem, value: unknown) => {
    setRoomTypes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRoomTypeFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setRoomTypes((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          image_file: file,
          image_preview: preview,
        };
        return updated;
      });
    }
  };

  // Set Main Thumbnail
  const handleSetThumbnail = async (mediaUrl: string) => {
    if (!editingProperty) return;
    try {
      setSettingThumbnailUrl(mediaUrl);
      const res = await fetch(`/api/partner/properties/${editingProperty.id}/thumbnail`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_url: mediaUrl }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingProperty((prev) => (prev ? { ...prev, image_url: mediaUrl } : null));
        setProperties((prev) =>
          prev.map((p) => (p.id === editingProperty.id ? { ...p, image_url: mediaUrl } : p))
        );
        setFormData((prev) => ({
          ...prev,
          image_url: mediaUrl && !mediaUrl.startsWith("/uploads/") ? mediaUrl : "",
        }));
      } else {
        setActionError(data.error || "Gagal mengatur thumbnail.");
      }
    } catch {
      setActionError("Terjadi kesalahan saat mengatur thumbnail.");
    } finally {
      setSettingThumbnailUrl(null);
    }
  };

  // Delete Media
  const handleDeleteExistingMedia = async (mediaId: string, mediaUrl: string) => {
    if (!editingProperty) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus media ini?")) return;

    try {
      setDeletingMediaId(mediaId);
      const res = await fetch(`/api/partner/media/${mediaId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        const updatedMedia = (editingProperty.media || []).filter((m) => m.id !== mediaId);
        let newImageUrl = editingProperty.image_url;
        if (editingProperty.image_url === mediaUrl) {
          const nextImg = updatedMedia.find((m) => m.type === "IMAGE") || updatedMedia[0];
          newImageUrl = nextImg ? nextImg.url : "";
        }

        const updatedProperty: Property = {
          ...editingProperty,
          image_url: newImageUrl,
          media: updatedMedia,
        };

        setEditingProperty(updatedProperty);
        setProperties((prev) =>
          prev.map((p) => (p.id === editingProperty.id ? updatedProperty : p))
        );
      } else {
        setActionError(data.error || "Gagal menghapus media.");
      }
    } catch {
      setActionError("Terjadi kesalahan saat menghapus media.");
    } finally {
      setDeletingMediaId(null);
    }
  };

  // Quick Room Counter
  const handleUpdateRoomQuick = async (propertyId: string, delta: number) => {
    const target = properties.find((p) => p.id === propertyId);
    if (!target) return;

    const newRooms = Math.max(0, target.available_rooms + delta);
    if (newRooms === target.available_rooms) return;

    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, available_rooms: newRooms } : p))
    );

    try {
      await fetch(`/api/partner/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available_rooms: newRooms }),
      });
    } catch {
      fetchProperties();
    }
  };

  // AI Description Generator
  const handleGenerateAiDescription = async () => {
    try {
      setIsAiGenerating(true);
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || "Kos Nyaman",
          facilities: formData.facilities,
          price_per_month: formData.price_per_month,
          gender_type: formData.gender_type,
          address: formData.address,
          is_pet_friendly: formData.is_pet_friendly,
          is_24_hours: formData.is_24_hours,
          rules: formData.rules,
          rental_terms: formData.rental_terms,
          room_types: roomTypes,
        }),
      });

      const data = await res.json();
      if (data.success && data.description) {
        setFormData((prev) => ({ ...prev, description: data.description }));
        setSuccessMsg("Deskripsi promosi AI berhasil dibuat!");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      setErrorMsg("Gagal membuat deskripsi AI.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save Property Form Handler
  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg("Nama properti wajib diisi.");
      return;
    }

    let computedPrice = formData.price_per_month;
    let computedRooms = formData.available_rooms;

    if (roomTypes.length > 0) {
      for (let i = 0; i < roomTypes.length; i++) {
        const rt = roomTypes[i];
        if (!rt.name.trim()) {
          setErrorMsg(`Nama Tipe Kamar #${i + 1} wajib diisi.`);
          return;
        }
        if (!rt.price_per_month || Number(rt.price_per_month) <= 0 || isNaN(Number(rt.price_per_month))) {
          setErrorMsg(`Harga Tipe Kamar "${rt.name || `#${i + 1}`}" harus lebih dari 0.`);
          return;
        }
      }
      computedPrice = String(Math.min(...roomTypes.map((rt) => Number(rt.price_per_month))));
      computedRooms = String(roomTypes.reduce((sum, rt) => sum + Number(rt.available_rooms || 0), 0));
    }

    try {
      setIsSaving(true);
      const isEdit = modalMode === "EDIT" && editingProperty;
      const endpoint = isEdit
        ? `/api/partner/properties/${editingProperty.id}`
        : "/api/partner/properties";
      const method = isEdit ? "PATCH" : "POST";

      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("price_per_month", computedPrice);
      data.append("available_rooms", computedRooms);
      data.append("gender_type", formData.gender_type);
      data.append("facilities", formData.facilities.trim());
      data.append("address", formData.address.trim());
      data.append("latitude", formData.latitude.trim());
      data.append("longitude", formData.longitude.trim());
      data.append("is_pet_friendly", String(formData.is_pet_friendly));
      data.append("is_24_hours", String(formData.is_24_hours));
      data.append("description", formData.description.trim());
      data.append("rules", formData.rules.trim());
      data.append("rental_terms", formData.rental_terms.trim());
      data.append("youtube_url", formData.youtube_url.trim());

      if (formData.image_url.trim()) {
        data.append("image_url", formData.image_url.trim());
      }

      if (roomTypes.length > 0) {
        data.append(
          "room_types",
          JSON.stringify(
            roomTypes.map((rt) => ({
              id: rt.id,
              name: rt.name,
              price_per_month: rt.price_per_month,
              security_deposit: Number(rt.security_deposit) || 0,
              available_rooms: rt.available_rooms,
              facilities: rt.facilities,
              specifications: rt.specifications,
              image_url: rt.image_url,
            }))
          )
        );

        roomTypes.forEach((rt, idx) => {
          if (rt.image_file) {
            data.append(`room_type_file_${idx}`, rt.image_file);
          }
        });
      }

      selectedFiles.forEach((file) => data.append("media", file));

      const res = await fetch(endpoint, {
        method,
        body: data,
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setErrorMsg(resData.error || "Gagal menyimpan data properti.");
        return;
      }

      const wasRejected = isEdit && editingProperty?.status === "REJECTED";
      setSuccessMsg(
        isEdit
          ? wasRejected
            ? "Revisi berhasil disimpan! Properti kos telah diajukan kembali ke Admin untuk ditinjau ulang."
            : "Properti berhasil diperbarui!"
          : "Properti baru berhasil ditambahkan! Menunggu persetujuan Admin sebelum tayang."
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      closeModal();
      fetchProperties();
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat menyimpan properti.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromoteProperty = async () => {
    if (!promotingProperty) return;
    setIsPromoting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/partner/properties/${promotingProperty.id}/featured`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays: promoteDurationDays }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses promosi kos.");
      }
      setSuccessMsg(data.message || "Status Kos Rekomendasi berhasil diaktifkan!");
      setTimeout(() => setSuccessMsg(null), 4000);
      setProperties((prev) =>
        prev.map((p) =>
          p.id === promotingProperty.id
            ? { ...p, is_featured: true, featured_until: data.data?.featured_until }
            : p
        )
      );
      setPromotingProperty(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan saat mempromosikan kos.");
    } finally {
      setIsPromoting(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/partner/properties/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Properti berhasil dihapus.");
        setTimeout(() => setSuccessMsg(null), 3000);
        setDeleteConfirmId(null);
        fetchProperties();
      }
    } catch {
      setErrorMsg("Gagal menghapus properti.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Kelola Properti Kos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tambah kos baru, upload foto &amp; video, tentukan tipe kamar, deskripsi, aturan, dan pantau ketersediaan kamar.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kos Baru</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Property Cards Grid */}
      {isLoading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Memuat data properti Anda...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Belum Ada Properti Terdaftar</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Daftarkan properti kos pertama Anda untuk mulai menerima calon penyewa dari KosPasti.
          </p>
          <button
            type="button"
            onClick={openNewModal}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
          >
            + Tambah Properti Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Image & Badges */}
              <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800">
                <Image
                  src={prop.image_url || "/images/placeholder.jpg"}
                  alt={prop.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                      prop.gender_type === "PUTRA"
                        ? "bg-blue-600/90 text-white"
                        : prop.gender_type === "PUTRI"
                        ? "bg-pink-600/90 text-white"
                        : "bg-purple-600/90 text-white"
                    }`}
                  >
                    {prop.gender_type}
                  </span>
                  {prop.is_24_hours && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                      24 Jam
                    </span>
                  )}
                  {prop.is_pet_friendly && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-600/90 text-white backdrop-blur-md inline-flex items-center gap-1">
                      <PawPrint className="w-3 h-3" />
                      <span>Pet</span>
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  <a
                    href={`/kos/${prop.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-md backdrop-blur-md transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <span>Pratinjau</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {/* Status Approval Badge & Featured Badge */}
                  <div className="mb-2.5 flex items-center gap-2 flex-wrap">
                    {prop.status === "PUBLISHED" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Aktif (Disetujui)</span>
                      </span>
                    ) : prop.status === "REJECTED" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span>Ditolak Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Menunggu Persetujuan Admin</span>
                      </span>
                    )}

                    {prop.is_featured && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>
                          Rekomendasi Aktif
                          {prop.featured_until &&
                            ` (${Math.max(
                              0,
                              Math.ceil(
                                (new Date(prop.featured_until).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )}h)`}
                        </span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {prop.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1 mt-1 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{prop.address || "Lokasi belum diatur"}</span>
                  </p>

                  {/* Rejection / Pending info */}
                  {prop.status === "REJECTED" && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs space-y-2">
                      <div>
                        <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200 mb-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>Alasan Penolakan:</span>
                        </div>
                        <p className="text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed pl-5">
                          {prop.rejectionReason || "Data properti belum memenuhi standar listing KosPasti. Harap periksa dan lengkapi data kos."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/40 flex items-start gap-2 text-rose-900 dark:text-rose-200 text-[11px] bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl">
                        <Info className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <p className="leading-snug">
                          <span className="font-bold">Cara Mengajukan Ulang:</span> Klik tombol <strong>&ldquo;Perbaiki &amp; Ajukan Ulang&rdquo;</strong> di bawah untuk merevisi data kos. Setelah disimpan, kos akan otomatis diajukan kembali ke Admin untuk ditinjau.
                        </p>
                      </div>
                    </div>
                  )}

                  {prop.status === "PENDING_REVIEW" && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Kos sedang direview admin dan belum tayang di pencarian publik.</span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Mulai Dari</span>
                      <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                        Rp {prop.price_per_month.toLocaleString("id-ID")}{" "}
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">/bln</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block">Pesanan</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {prop._count?.bookings || 0} Booking
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fast Room Counter & Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-teal-600" />
                      <span>Total Sisa Kamar:</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomQuick(prop.id, -1)}
                        disabled={prop.available_rooms <= 0}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-black text-sm text-slate-900 dark:text-white">
                        {prop.available_rooms}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomQuick(prop.id, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {prop.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPromotingProperty(prop);
                        setPromoteDurationDays(30);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:-translate-y-px active:scale-95 cursor-pointer border border-amber-200 dark:border-amber-800/80"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{prop.is_featured ? "Perpanjang Rekomendasi" : "Promosikan Kos (Unggulan)"}</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(prop)}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:-translate-y-px active:scale-95 cursor-pointer ${
                        prop.status === "REJECTED"
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:shadow-sm"
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{prop.status === "REJECTED" ? "Perbaiki & Ajukan Ulang" : "Edit Rincian"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(prop.id)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all hover:-translate-y-px active:scale-95 cursor-pointer hover:shadow-sm"
                      title="Hapus Properti"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / CREATE PROPERTY MODAL */}
      <PropertyModalForm
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        role="partner"
        editingProperty={editingProperty}
        onSuccess={() => {
          fetchProperties();
          closeModal();
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Hapus Properti Kos?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Tindakan ini permanen. Seluruh data kamar dan histori terkait properti ini akan dihapus.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProperty(deleteConfirmId)}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Ya, Hapus</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMOTION / FEATURED MODAL */}
      {promotingProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {promotingProperty.is_featured ? "Perpanjang Masa Unggulan" : "Jadikan Kos Rekomendasi"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {promotingProperty.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromotingProperty(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
                  Keuntungan Kos Rekomendasi:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                  <li>Tampil di section khusus &quot;Kos Rekomendasi Pilihan KosPasti&quot; di Beranda.</li>
                  <li>Mendapat badge Rekomendasi di hasil pencarian.</li>
                  <li>Dapat difilter langsung oleh pencari kos dengan quick filter Rekomendasi.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Durasi Promosi:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 7, label: "7 Hari" },
                    { days: 14, label: "14 Hari" },
                    { days: 30, label: "30 Hari" },
                  ].map((option) => (
                    <button
                      key={option.days}
                      type="button"
                      onClick={() => setPromoteDurationDays(option.days)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        promoteDurationDays === option.days
                          ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 ring-2 ring-amber-500/20"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {promotingProperty.featured_until && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Masa aktif saat ini berakhir pada:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(promotingProperty.featured_until).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  . Durasi baru akan ditambahkan dari hari ini.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPromotingProperty(null)}
                disabled={isPromoting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePromoteProperty}
                disabled={isPromoting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isPromoting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    <span>Aktifkan Promosi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
