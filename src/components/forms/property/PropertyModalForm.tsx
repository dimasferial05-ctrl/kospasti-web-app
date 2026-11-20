"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  AlertCircle,
  Building2,
  Sparkles,
  MapPin,
  Clock,
  PawPrint,
  Check,
} from "lucide-react";
import LocationPicker from "@/components/map/LocationPicker";
import {
  PropertyFormData,
  RoomTypeFormItem,
  OwnerOption,
  initialPropertyFormData,
} from "@/types/property-form";
import { PropertyRoomTypesManager } from "./PropertyRoomTypesManager";
import { PropertyMediaUploadSection } from "./PropertyMediaUploadSection";

export interface PropertyModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  role: "admin" | "partner";
  editingProperty: any | null;
  onSuccess: () => void;
  owners?: OwnerOption[];
}

export function PropertyModalForm({
  isOpen,
  onClose,
  role,
  editingProperty,
  onSuccess,
  owners = [],
}: PropertyModalFormProps) {
  const [formData, setFormData] = useState<PropertyFormData>(initialPropertyFormData);
  const [roomTypes, setRoomTypes] = useState<RoomTypeFormItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const isEdit = Boolean(editingProperty);

  useEffect(() => {
    if (editingProperty) {
      setFormData({
        name: editingProperty.name || "",
        owner_id: editingProperty.owner_id || "",
        address: editingProperty.address || "",
        latitude: editingProperty.latitude ? String(editingProperty.latitude) : "",
        longitude: editingProperty.longitude ? String(editingProperty.longitude) : "",
        gender_type: editingProperty.gender_type || "CAMPUR",
        price_per_month: String(editingProperty.price_per_month || ""),
        available_rooms: String(editingProperty.available_rooms ?? ""),
        facilities: editingProperty.facilities || "",
        description: editingProperty.description || "",
        rules: editingProperty.rules || "",
        rental_terms: editingProperty.rental_terms || "",
        youtube_url: editingProperty.youtube_url || "",
        image_url:
          editingProperty.image_url && !editingProperty.image_url.startsWith("/uploads/")
            ? editingProperty.image_url
            : "",
        is_pet_friendly: Boolean(editingProperty.is_pet_friendly),
        is_24_hours: Boolean(editingProperty.is_24_hours),
      });

      if (editingProperty.room_types && Array.isArray(editingProperty.room_types)) {
        setRoomTypes(
          editingProperty.room_types.map((rt: any) => ({
            id: rt.id,
            name: rt.name,
            price_per_month: String(rt.price_per_month || ""),
            security_deposit: rt.security_deposit ? String(rt.security_deposit) : "",
            available_rooms: String(rt.available_rooms ?? ""),
            facilities: rt.facilities || "",
            specifications: rt.specifications || "",
            image_url: rt.image_url || "",
          }))
        );
      } else {
        setRoomTypes([]);
      }
    } else {
      setFormData(initialPropertyFormData);
      setRoomTypes([]);
    }
    setSelectedFiles([]);
    setFormError(null);
  }, [editingProperty, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationChange = (lat: number, lng: number, address?: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: String(lat),
      longitude: String(lng),
      address: address || prev.address,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
      } else {
        setFormError(data.error || "Gagal membuat deskripsi AI.");
      }
    } catch {
      setFormError("Gagal membuat deskripsi AI.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const endpoint =
        role === "admin"
          ? isEdit
            ? `/api/admin/properties/${editingProperty.id}`
            : "/api/admin/properties"
          : isEdit
          ? `/api/partner/properties/${editingProperty.id}`
          : "/api/partner/properties";

      const method = isEdit ? "PATCH" : "POST";

      const submitData = new FormData();
      submitData.append("name", formData.name);
      if (role === "admin" && formData.owner_id) {
        submitData.append("owner_id", formData.owner_id);
      }
      submitData.append("address", formData.address);
      submitData.append("latitude", formData.latitude);
      submitData.append("longitude", formData.longitude);
      submitData.append("gender_type", formData.gender_type);
      submitData.append("price_per_month", formData.price_per_month);
      submitData.append("available_rooms", formData.available_rooms);
      submitData.append("facilities", formData.facilities);
      submitData.append("description", formData.description);
      submitData.append("rules", formData.rules);
      submitData.append("rental_terms", formData.rental_terms);
      submitData.append("youtube_url", formData.youtube_url);
      submitData.append("image_url", formData.image_url);
      submitData.append("is_pet_friendly", String(formData.is_pet_friendly));
      submitData.append("is_24_hours", String(formData.is_24_hours));

      // Append room types JSON
      submitData.append("room_types", JSON.stringify(roomTypes));

      // Append room type image files
      roomTypes.forEach((rt, idx) => {
        if (rt.image_file) {
          submitData.append(`room_type_image_${idx}`, rt.image_file);
        }
      });

      // Append selected media files
      selectedFiles.forEach((file) => {
        submitData.append("files", file);
      });

      const res = await fetch(endpoint, {
        method,
        body: submitData,
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        onSuccess();
        onClose();
      } else {
        setFormError(resData.error || "Gagal menyimpan data properti kos.");
      }
    } catch {
      setFormError("Terjadi kesalahan server saat menyimpan properti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {isEdit ? "Edit Properti Kos" : "Tambah Properti Kos Baru"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lengkapi rincian properti kos, harga sewa, dan fasilitas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 space-y-6 flex-1">
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Data Utama */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Informasi Utama
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Properti Kos <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="cth: Kos Graha Asri Putri"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>

              {role === "admin" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pemilik Kos (Owner) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="owner_id"
                    required
                    value={formData.owner_id}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  >
                    <option value="">Pilih Pemilik...</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.whatsapp_number})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Kos <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender_type"
                  required
                  value={formData.gender_type}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                >
                  <option value="CAMPUR">CAMPUR (Pria &amp; Wanita)</option>
                  <option value="PUTRA">PUTRA</option>
                  <option value="PUTRI">PUTRI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Harga/Bln (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  name="price_per_month"
                  value={formData.price_per_month}
                  onChange={handleInputChange}
                  placeholder="cth: 1200000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sisa Kamar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  name="available_rooms"
                  value={formData.available_rooms}
                  onChange={handleInputChange}
                  placeholder="cth: 5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Gambar (Opsional)
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fasilitas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                name="facilities"
                value={formData.facilities}
                onChange={handleInputChange}
                placeholder="cth: WiFi Cepat, AC, Kamar Mandi Dalam, Kasur Springbed, Parkir Motor"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>
          </div>

          {/* Section 2: Lokasi & Peta */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lokasi &amp; Alamat Properti</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Lengkap
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="cth: Jl. Kaliurang KM 5, Gang Pandega Marta No. 12, Sleman"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>

            <LocationPicker
              latitude={formData.latitude ? parseFloat(formData.latitude) : null}
              longitude={formData.longitude ? parseFloat(formData.longitude) : null}
              onChange={(lat, lng) => handleLocationChange(lat, lng)}
              onAddressChange={(address) =>
                setFormData((prev) => ({ ...prev, address }))
              }
            />
          </div>

          {/* Section 3: Fitur & Fasilitas Tambahan */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Preferensi &amp; Peraturan
            </h3>

            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_pet_friendly"
                  checked={formData.is_pet_friendly}
                  onChange={handleInputChange}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <PawPrint className="w-4 h-4 text-emerald-600" />
                <span>Boleh Bawa Hewan Peliharaan (Pet-Friendly)</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_24_hours"
                  checked={formData.is_24_hours}
                  onChange={handleInputChange}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Akses 24 Jam (Bebas Jam Malam)</span>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Properti
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isAiGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Buat dengan AI</span>
                </button>
              </div>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Jelaskan kenyamanan dan keunggulan properti kos Anda..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 4: Varian Tipe Kamar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <PropertyRoomTypesManager
              roomTypes={roomTypes}
              setRoomTypes={setRoomTypes}
              isEdit={isEdit}
            />
          </div>

          {/* Section 5: Unggah Media */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <PropertyMediaUploadSection
              selectedFiles={selectedFiles}
              onFileChange={handleFileChange}
              onRemoveSelectedFile={handleRemoveSelectedFile}
              existingMedia={editingProperty?.media}
              thumbnailUrl={editingProperty?.image_url}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft hover:shadow-float active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEdit ? "Simpan Perubahan" : "Terbitkan Properti"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
