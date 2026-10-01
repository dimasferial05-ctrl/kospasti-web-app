"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  BedDouble,
  Sparkles,
  MapPin,
  Loader2,
  CheckCircle2,
  X,
  Info,
  ExternalLink,
  HelpCircle,
  FileText,
  Star,
  Play,
  Clock,
  Home,
} from "lucide-react";

interface PropertyMediaItem {
  id: string;
  url: string;
  type: string;
}

interface RoomTypeItem {
  id?: string;
  name: string;
  price_per_month: number | string;
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalMode, setModalMode] = useState<"NEW" | "EDIT" | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      image_url: prop.image_url && !prop.image_url.startsWith("/uploads/") ? prop.image_url : "",
      is_pet_friendly: Boolean(prop.is_pet_friendly),
      is_24_hours: Boolean(prop.is_24_hours),
    });

    if (prop.room_types && prop.room_types.length > 0) {
      setRoomTypes(
        prop.room_types.map((rt) => ({
          id: rt.id,
          name: rt.name,
          price_per_month: String(rt.price_per_month),
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
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingProperty(null);
    setSelectedFiles([]);
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
      alert("Properti wajib memiliki minimal 1 tipe kamar.");
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
        alert(data.error || "Gagal mengatur thumbnail.");
      }
    } catch {
      alert("Terjadi kesalahan saat mengatur thumbnail.");
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
        alert(data.error || "Gagal menghapus media.");
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus media.");
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

      setSuccessMsg(
        isEdit
          ? "Properti berhasil diperbarui!"
          : "Properti baru berhasil ditambahkan!"
      );
      setTimeout(() => setSuccessMsg(null), 3000);
      closeModal();
      fetchProperties();
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat menyimpan properti.");
    } finally {
      setIsSaving(false);
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kelola Properti Kos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Property Cards Grid */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Memuat data properti Anda...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Belum Ada Properti Terdaftar</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
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
              className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Image & Badges */}
              <div className="relative h-48 w-full bg-slate-100">
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
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-600/90 text-white backdrop-blur-md">
                      🐾 Pet
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  <a
                    href={`/kos/${prop.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-white/95 text-slate-800 hover:text-emerald-600 shadow-md backdrop-blur-md transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <span>Pratinjau</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                    {prop.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-1 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{prop.address || "Lokasi belum diatur"}</span>
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Mulai Dari</span>
                      <span className="text-sm font-black text-emerald-700">
                        Rp {prop.price_per_month.toLocaleString("id-ID")}{" "}
                        <span className="text-[10px] font-medium text-slate-500">/bln</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block">Pesanan</span>
                      <span className="text-xs font-bold text-slate-800">
                        {prop._count?.bookings || 0} Booking
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fast Room Counter & Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-teal-600" />
                      <span>Total Sisa Kamar:</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomQuick(prop.id, -1)}
                        disabled={prop.available_rooms <= 0}
                        className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-black text-sm text-slate-900">
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(prop)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Rincian</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(prop.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors cursor-pointer"
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
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>{modalMode === "EDIT" ? "Edit Data Kos" : "Tambah Kos Baru"}</span>
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="mt-5 space-y-5">
              {/* Nama Kos & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Kos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kos Melati Asri Subang"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori Kos *
                  </label>
                  <select
                    value={formData.gender_type}
                    onChange={(e) => setFormData({ ...formData, gender_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="PUTRA">Khusus Putra</option>
                    <option value="PUTRI">Khusus Putri</option>
                    <option value="CAMPUR">Campur</option>
                  </select>
                </div>
              </div>

              {/* Alamat & Titik Koordinat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Lengkap Kos
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. RA Kartini No. 45, RT 02/RW 05, Subang..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Titik Koordinat */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Titik Koordinat Peta (Latitude &amp; Longitude)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCoordHelp(!showCoordHelp)}
                    className="text-xs text-emerald-600 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Petunjuk Peta</span>
                  </button>
                </div>

                {showCoordHelp && (
                  <div className="mb-2 p-3 rounded-xl bg-slate-100 text-xs text-slate-600">
                    Buka Google Maps, klik kanan atau tekan lokasi kos Anda, lalu salin angka Latitude dan Longitude.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Latitude (misal: -6.5622)"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Longitude (misal: 107.7680)"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fasilitas Umum */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fasilitas Umum Properti (Dipisah tanda koma)
                </label>
                <input
                  type="text"
                  placeholder="WiFi, Dapur Bersama, Area Parkir Motor, Kulkas Bersama, CCTV"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Akses & Kebijakan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    formData.is_24_hours
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_24_hours}
                    onChange={(e) => setFormData({ ...formData, is_24_hours: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                      formData.is_24_hours ? "bg-white text-slate-900 border-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {formData.is_24_hours && <CheckCircle2 className="w-3.5 h-3.5 fill-slate-900 text-white" />}
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Clock size={13} className={formData.is_24_hours ? "text-slate-300" : "text-slate-400"} />
                      <span>Akses 24 Jam</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${formData.is_24_hours ? "text-slate-300" : "text-slate-400"}`}>
                      Bebas keluar masuk tanpa jam malam
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    formData.is_pet_friendly
                      ? "bg-emerald-900 border-emerald-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_pet_friendly}
                    onChange={(e) => setFormData({ ...formData, is_pet_friendly: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                      formData.is_pet_friendly ? "bg-white text-emerald-900 border-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {formData.is_pet_friendly && <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-900 text-white" />}
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Sparkles size={13} className={formData.is_pet_friendly ? "text-emerald-200" : "text-slate-400"} />
                      <span>Pet Friendly</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${formData.is_pet_friendly ? "text-emerald-200" : "text-slate-400"}`}>
                      Boleh memelihara hewan peliharaan
                    </p>
                  </div>
                </label>
              </div>

              {/* Tipe Kamar Management */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-emerald-600" />
                      <span>Rincian Tipe Kamar ({roomTypes.length})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tentukan nama, harga per bulan, sisa kamar, dan fasilitas khusus tiap tipe kamar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRoomType}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Tipe</span>
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {roomTypes.map((rt, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tipe Kamar #{idx + 1}</span>
                        </span>
                        {roomTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRoomType(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Nama Tipe Kamar *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Tipe Standar AC"
                            value={rt.name}
                            onChange={(e) => updateRoomType(idx, "name", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Harga / Bulan (Rp) *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="10000"
                            placeholder="850000"
                            value={rt.price_per_month}
                            onChange={(e) => updateRoomType(idx, "price_per_month", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Sisa Kamar *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="3"
                            value={rt.available_rooms}
                            onChange={(e) => updateRoomType(idx, "available_rooms", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Fasilitas Khusus Kamar Ini
                          </label>
                          <input
                            type="text"
                            placeholder="Kasur Springbed, AC, Kamar Mandi Dalam, Meja Kerja"
                            value={rt.facilities || ""}
                            onChange={(e) => updateRoomType(idx, "facilities", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Spesifikasi Kamar (Opsional)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Ukuran 3x4, Jendela Hadap Luar, Listrik Token Mandiri"
                            value={rt.specifications || ""}
                            onChange={(e) => updateRoomType(idx, "specifications", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Room Photo Upload */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Foto Kamar
                        </label>
                        <div className="flex items-center gap-3">
                          {rt.image_preview ? (
                            <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 relative shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={rt.image_preview} alt={rt.name} className="w-full h-full object-cover" />
                            </div>
                          ) : null}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleRoomTypeFileChange(idx, e)}
                            className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Media Tersimpan (Hanya Tampil saat Edit Properti) */}
              {editingProperty && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Media Tersimpan ({editingProperty.media?.length || 0})
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Klik bintang untuk jadikan thumbnail utama
                    </span>
                  </div>

                  {editingProperty.media && editingProperty.media.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                      {editingProperty.media.map((item) => {
                        const isThumbnail = editingProperty.image_url === item.url;
                        const isDeleting = deletingMediaId === item.id;
                        const isSetting = settingThumbnailUrl === item.url;

                        return (
                          <div
                            key={item.id}
                            className={`relative group rounded-lg overflow-hidden border ${
                              isThumbnail ? "border-amber-400 ring-2 ring-amber-400/40" : "border-slate-200"
                            } bg-black/5 aspect-video flex items-center justify-center`}
                          >
                            {item.type === "VIDEO" ? (
                              <div className="w-full h-full relative bg-slate-800 flex items-center justify-center">
                                <video src={item.url} className="w-full h-full object-cover pointer-events-none" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Play size={18} className="text-white fill-white" />
                                </div>
                              </div>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={item.url} alt="Media property" className="w-full h-full object-cover" />
                            )}

                            {isThumbnail && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 text-white rounded text-[9px] font-bold flex items-center gap-1 shadow-xs z-10">
                                <Star size={9} className="fill-white" />
                                <span>Thumbnail</span>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1 z-20">
                              {!isThumbnail && (
                                <button
                                  type="button"
                                  disabled={isSetting || isDeleting}
                                  onClick={() => handleSetThumbnail(item.url)}
                                  className="p-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Jadikan Thumbnail Utama"
                                >
                                  {isSetting ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isDeleting || isSetting}
                                onClick={() => handleDeleteExistingMedia(item.id, item.url)}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Hapus Media"
                              >
                                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      Belum ada gambar atau video tersimpan untuk properti ini.
                    </div>
                  )}
                </div>
              )}

              {/* Unggah Media Baru (Foto & Video) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Unggah Media Baru (Gambar &amp; Video)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4,video/webm,video/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-200 rounded-xl p-1.5 bg-white cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Unggah beberapa foto dan video room-tour sekaligus (format: MP4, WebM, JPG, PNG).
                </p>

                {selectedFiles.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate text-slate-700 font-medium">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(idx)}
                            className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* URL Video YouTube */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  URL Video YouTube (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="Contoh: https://www.youtube.com/watch?v=..."
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Video tour atau review kos dari YouTube yang bisa langsung diputar calon penyewa.
                </p>
              </div>

              {/* Deskripsi Kos & AI Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Deskripsi Kos (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isAiGenerating}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Membuat...</span>
                      </>
                    ) : (
                      <span>Generate Deskripsi AI</span>
                    )}
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Ceritakan gambaran umum, keunggulan lingkungan, suasana kos, dan poin menarik lainnya..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-y"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Deskripsi akan ditampilkan pada card khusus &quot;Deskripsi Kos&quot; di atas pilihan tipe kamar pada halaman detail kos.
                </p>
              </div>

              {/* Peraturan Kos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tata Tertib &amp; Peraturan Kos (Opsional)
                </label>
                <textarea
                  rows={4}
                  placeholder={"1. Dilarang merokok di dalam kamar\n2. Tamu lawan jenis dilarang masuk kamar\n3. Waktu tenang dimulai pukul 22:00 WIB"}
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-y"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Gunakan baris baru untuk memisahkan setiap poin aturan.
                </p>
              </div>

              {/* Ketentuan Pengajuan Sewa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Syarat &amp; Ketentuan Pengajuan Sewa (Opsional)
                </label>
                <textarea
                  rows={4}
                  placeholder={"1. Menyerahkan foto/scan KTP atau Kartu Tanda Mahasiswa yang berlaku\n2. Pembayaran sewa lunas di muka\n3. Uang deposit jaminan Rp 150.000 (dikembalikan saat checkout)"}
                  value={formData.rental_terms}
                  onChange={(e) => setFormData({ ...formData, rental_terms: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-y"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Syarat dan ketentuan untuk calon penyewa saat mengajukan sewa kamar kos ini.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{modalMode === "EDIT" ? "Simpan Perubahan" : "Tambah Properti"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Hapus Properti Kos?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Tindakan ini permanen. Seluruh data kamar dan histori terkait properti ini akan dihapus.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
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
    </div>
  );
}
