"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Pencil,
  X,
  AlertCircle,
  FileText,
  Trash2,
  Star,
  Play,
  Clock,
  PawPrint,
  MapPin,
  Upload,
  Image as ImageIcon,
  Check,
  Award,
} from "lucide-react";
import LocationPicker from "@/components/map/LocationPicker";
import { PropertyModalForm } from "@/components/forms/property/PropertyModalForm";

interface OwnerOption {
  id: string;
  name: string;
  whatsapp_number: string;
}

interface PropertyMediaItem {
  id: string;
  url: string;
  type: string;
}

interface RoomTypeAdminItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  facilities?: string | null;
  specifications?: string | null;
  image_url?: string | null;
}

interface RoomTypeFormItem {
  id?: string;
  name: string;
  price_per_month: string;
  available_rooms: string;
  facilities: string;
  specifications: string;
  image_url?: string;
  image_file?: File | null;
  image_preview?: string | null;
}

interface PropertyAdminItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_pet_friendly?: boolean;
  is_24_hours?: boolean;
  description?: string | null;
  rules?: string | null;
  rental_terms?: string | null;
  youtube_url?: string | null;
  media?: PropertyMediaItem[];
  room_types?: RoomTypeAdminItem[];
  owner_id: string;
  owner?: OwnerOption | null;
  status?: string;
  rejectionReason?: string | null;
  is_featured?: boolean;
  featured_until?: string | null;
}

interface PropertyFormData {
  name: string;
  owner_id: string;
  price_per_month: string;
  available_rooms: string;
  gender_type: string;
  facilities: string;
  image_url: string;
  address: string;
  latitude: string;
  longitude: string;
  is_pet_friendly: boolean;
  is_24_hours: boolean;
  description: string;
  rules: string;
  rental_terms: string;
  youtube_url: string;
}

const initialFormData: PropertyFormData = {
  name: "",
  owner_id: "",
  price_per_month: "",
  available_rooms: "0",
  gender_type: "CAMPUR",
  facilities: "",
  image_url: "",
  address: "",
  latitude: "",
  longitude: "",
  is_pet_friendly: false,
  is_24_hours: false,
  description: "",
  rules: "",
  rental_terms: "",
  youtube_url: "",
};

export default function ManagePropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyAdminItem[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status Tab Filter & Approval States
  const [selectedStatusTab, setSelectedStatusTab] = useState<"ALL" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED">("ALL");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [propertyToReject, setPropertyToReject] = useState<PropertyAdminItem | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [rejectModalError, setRejectModalError] = useState<string | null>(null);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);
  const [statusAlert, setStatusAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Featured / Rekomendasi Management States
  const [featuredModalProperty, setFeaturedModalProperty] = useState<PropertyAdminItem | null>(null);
  const [featuredActiveInput, setFeaturedActiveInput] = useState<boolean>(false);
  const [featuredDurationDays, setFeaturedDurationDays] = useState<number>(30);
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState<boolean>(false);
  const [featuredModalError, setFeaturedModalError] = useState<string | null>(null);

  const handleOpenFeaturedModal = (prop: PropertyAdminItem) => {
    setFeaturedModalProperty(prop);
    setFeaturedActiveInput(Boolean(prop.is_featured));
    setFeaturedDurationDays(30);
    setFeaturedModalError(null);
  };

  const handleSaveFeatured = async () => {
    if (!featuredModalProperty) return;
    try {
      setIsUpdatingFeatured(true);
      setFeaturedModalError(null);

      let featuredUntilDate: string | null = null;
      if (featuredActiveInput && featuredDurationDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + featuredDurationDays);
        featuredUntilDate = d.toISOString();
      }

      const res = await fetch(`/api/admin/properties/${featuredModalProperty.id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_featured: featuredActiveInput,
          featured_until: featuredUntilDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui status rekomendasi.");
      }

      setStatusAlert({
        type: "success",
        message: data.message || `Status rekomendasi "${featuredModalProperty.name}" berhasil diperbarui.`,
      });

      setProperties((prev) =>
        prev.map((p) =>
          p.id === featuredModalProperty.id
            ? {
                ...p,
                is_featured: featuredActiveInput,
                featured_until: featuredUntilDate,
              }
            : p
        )
      );
      setFeaturedModalProperty(null);
    } catch (err) {
      setFeaturedModalError(err instanceof Error ? err.message : "Gagal memperbarui status rekomendasi.");
    } finally {
      setIsUpdatingFeatured(false);
    }
  };

  const handleApproveProperty = async (prop: PropertyAdminItem) => {
    try {
      setIsUpdatingStatusId(prop.id);
      setStatusAlert(null);
      const res = await fetch(`/api/admin/properties/${prop.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusAlert({ type: "success", message: `Properti "${prop.name}" berhasil disetujui dan aktif tayang publik!` });
        await fetchProperties();
      } else {
        setStatusAlert({ type: "error", message: data.error || "Gagal menyetujui properti." });
      }
    } catch {
      setStatusAlert({ type: "error", message: "Terjadi gangguan jaringan saat menyetujui properti." });
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const handleOpenRejectModal = (prop: PropertyAdminItem) => {
    setPropertyToReject(prop);
    setRejectionReasonText(prop.rejectionReason || "");
    setRejectModalError(null);
    setRejectModalOpen(true);
  };

  const handleConfirmRejectProperty = async () => {
    if (!propertyToReject) return;
    if (!rejectionReasonText.trim()) {
      setRejectModalError("Alasan penolakan wajib diisi untuk menginfokan pemilik kos.");
      return;
    }

    try {
      setIsUpdatingStatusId(propertyToReject.id);
      setRejectModalError(null);
      const res = await fetch(`/api/admin/properties/${propertyToReject.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: rejectionReasonText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusAlert({ type: "success", message: `Properti "${propertyToReject.name}" berhasil ditolak.` });
        setRejectModalOpen(false);
        setPropertyToReject(null);
        setRejectionReasonText("");
        await fetchProperties();
      } else {
        setRejectModalError(data.error || "Gagal menolak properti.");
      }
    } catch {
      setRejectModalError("Terjadi gangguan jaringan saat menolak properti.");
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  // State Modal Form (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyAdminItem | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [roomTypes, setRoomTypes] = useState<RoomTypeFormItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [settingThumbnailUrl, setSettingThumbnailUrl] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

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

  // Fetch daftar properti
  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/properties");

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setProperties(data.data);
      }
    } catch (err) {
      console.error("Fetch properties error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch daftar pemilik kos (owner) untuk dropdown form
  const fetchOwners = useCallback(async () => {
    try {
      setIsLoadingOwners(true);
      const res = await fetch("/api/admin/owners");

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setOwners(data.data);
      }
    } catch (err) {
      console.error("Fetch owners error:", err);
    } finally {
      setIsLoadingOwners(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOwners();
  }, [fetchProperties, fetchOwners]);

  // Buka Modal untuk Tambah Properti Baru
  const handleOpenAddModal = () => {
    setEditingProperty(null);
    setFormData({
      ...initialFormData,
      owner_id: owners.length > 0 ? owners[0].id : "",
      facilities: "",
      image_url: "",
      address: "",
      latitude: "",
      longitude: "",
      is_pet_friendly: false,
      is_24_hours: false,
      description: "",
      rules: "",
      rental_terms: "",
      youtube_url: "",
    });
    setRoomTypes([
      {
        name: "Tipe A (Standar)",
        price_per_month: "",
        available_rooms: "1",
        facilities: "",
        specifications: "",
        image_url: "",
        image_file: null,
        image_preview: null,
      },
    ]);
    setSelectedFiles([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Buka Modal untuk Edit Properti
  const handleOpenEditModal = (prop: PropertyAdminItem) => {
    setEditingProperty(prop);
    setFormData({
      name: prop.name || "",
      owner_id: prop.owner_id || prop.owner?.id || "",
      price_per_month: prop.price_per_month !== undefined ? String(prop.price_per_month) : "",
      available_rooms: prop.available_rooms !== undefined ? String(prop.available_rooms) : "0",
      gender_type: prop.gender_type || "CAMPUR",
      facilities: prop.facilities || "",
      image_url:
        prop.image_url && !prop.image_url.startsWith("/uploads/") && !prop.image_url.includes("images.unsplash.com")
          ? prop.image_url
          : "",
      address: prop.address || "",
      latitude: prop.latitude !== undefined && prop.latitude !== null ? String(prop.latitude) : "",
      longitude: prop.longitude !== undefined && prop.longitude !== null ? String(prop.longitude) : "",
      is_pet_friendly: Boolean(prop.is_pet_friendly),
      is_24_hours: Boolean(prop.is_24_hours),
      description: prop.description || "",
      rules: prop.rules || "",
      rental_terms: prop.rental_terms || "",
      youtube_url: prop.youtube_url || "",
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
          price_per_month: prop.price_per_month !== undefined ? String(prop.price_per_month) : "",
          available_rooms: prop.available_rooms !== undefined ? String(prop.available_rooms) : "0",
          facilities: prop.facilities || "",
          specifications: "",
          image_url: "",
          image_file: null,
          image_preview: null,
        },
      ]);
    }
    setSelectedFiles([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Tutup Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
    setFormData(initialFormData);
    setRoomTypes([]);
    setSelectedFiles([]);
    setFormError(null);
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

  // Handler untuk mengubah Thumbnail utama media
  const handleSetThumbnail = async (mediaUrl: string) => {
    if (!editingProperty) return;
    try {
      setSettingThumbnailUrl(mediaUrl);
      const res = await fetch(`/api/admin/properties/${editingProperty.id}/thumbnail`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ media_url: mediaUrl }),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const resData = await res.json();
      if (resData && resData.success) {
        setEditingProperty((prev) => (prev ? { ...prev, image_url: mediaUrl } : null));
        setProperties((prev) =>
          prev.map((p) => (p.id === editingProperty.id ? { ...p, image_url: mediaUrl } : p))
        );
        setFormData((prev) => ({
          ...prev,
          image_url: mediaUrl && !mediaUrl.startsWith("/uploads/") ? mediaUrl : "",
        }));
      } else {
        setFormError(resData.error || "Gagal mengatur thumbnail.");
      }
    } catch (err) {
      console.error("Error setting thumbnail:", err);
      setFormError("Terjadi kesalahan koneksi saat mengatur thumbnail.");
    } finally {
      setSettingThumbnailUrl(null);
    }
  };

  // Handler untuk menghapus satu media tersimpan
  const handleDeleteExistingMedia = async (mediaId: string, mediaUrl: string) => {
    if (!editingProperty) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus media ini?")) return;

    try {
      setDeletingMediaId(mediaId);
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const resData = await res.json();
      if (resData && resData.success) {
        const updatedMedia = (editingProperty.media || []).filter((m) => m.id !== mediaId);
        let newImageUrl = editingProperty.image_url;
        if (editingProperty.image_url === mediaUrl) {
          const nextImg = updatedMedia.find((m) => m.type === "IMAGE") || updatedMedia[0];
          newImageUrl = nextImg ? nextImg.url : "";
        }

        const updatedProperty: PropertyAdminItem = {
          ...editingProperty,
          image_url: newImageUrl,
          media: updatedMedia,
        };

        setEditingProperty(updatedProperty);
        setProperties((prev) =>
          prev.map((p) => (p.id === editingProperty.id ? updatedProperty : p))
        );
        setFormData((prev) => ({
          ...prev,
          image_url: newImageUrl && !newImageUrl.startsWith("/uploads/") ? newImageUrl : "",
        }));
      } else {
        setFormError(resData.error || "Gagal menghapus media.");
      }
    } catch (err) {
      console.error("Error deleting media:", err);
      setFormError("Terjadi kesalahan koneksi saat menghapus media.");
    } finally {
      setDeletingMediaId(null);
    }
  };

  // Submit Handler (Tambah atau Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validasi dasar client
    if (!formData.name.trim()) {
      setFormError("Nama properti kos wajib diisi.");
      return;
    }
    if (!formData.owner_id.trim()) {
      setFormError("Pemilik kos wajib dipilih.");
      return;
    }
    let computedPrice = formData.price_per_month;
    let computedRooms = formData.available_rooms;

    if (roomTypes.length > 0) {
      for (let i = 0; i < roomTypes.length; i++) {
        const rt = roomTypes[i];
        if (!rt.name.trim()) {
          setFormError(`Nama Tipe Kamar #${i + 1} wajib diisi.`);
          return;
        }
        if (!rt.price_per_month || Number(rt.price_per_month) <= 0 || isNaN(Number(rt.price_per_month))) {
          setFormError(`Harga Tipe Kamar "${rt.name || `#${i + 1}`}" harus lebih dari 0.`);
          return;
        }
        if (
          rt.available_rooms === "" ||
          Number(rt.available_rooms) < 0 ||
          isNaN(Number(rt.available_rooms))
        ) {
          setFormError(`Jumlah kamar Tipe Kamar "${rt.name || `#${i + 1}`}" harus >= 0.`);
          return;
        }
      }

      computedPrice = String(Math.min(...roomTypes.map((rt) => Number(rt.price_per_month))));
      computedRooms = String(roomTypes.reduce((sum, rt) => sum + Number(rt.available_rooms), 0));
    } else {
      if (!formData.price_per_month || Number(formData.price_per_month) <= 0) {
        setFormError("Harga per bulan harus lebih dari 0.");
        return;
      }
      if (
        formData.available_rooms === "" ||
        Number(formData.available_rooms) < 0 ||
        isNaN(Number(formData.available_rooms))
      ) {
        setFormError("Jumlah kamar tersedia harus berupa angka >= 0.");
        return;
      }
    }

    if (!formData.facilities.trim()) {
      setFormError("Fasilitas kos wajib diisi.");
      return;
    }
    if (formData.latitude.trim() !== "") {
      const lat = Number(formData.latitude.trim());
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setFormError("Latitude harus berupa angka antara -90 dan 90.");
        return;
      }
    }
    if (formData.longitude.trim() !== "") {
      const lng = Number(formData.longitude.trim());
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setFormError("Longitude harus berupa angka antara -180 dan 180.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const isEdit = !!editingProperty;
      const url = isEdit
        ? `/api/admin/properties/${editingProperty.id}`
        : "/api/admin/properties";
      const method = isEdit ? "PATCH" : "POST";

      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("owner_id", formData.owner_id.trim());
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
      if (formData.image_url.trim()) {
        data.append("image_url", formData.image_url.trim());
      }
      selectedFiles.forEach((file) => data.append("media", file));

      const res = await fetch(url, {
        method,
        body: data,
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const resData = await res.json();

      if (resData && resData.success) {
        handleCloseModal();
        await fetchProperties();
      } else {
        setFormError(resData.error || "Gagal menyimpan data properti.");
      }
    } catch (err) {
      console.error("Error submitting property form:", err);
      setFormError("Terjadi kesalahan jaringan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler untuk membuka modal konfirmasi hapus properti
  const handleDeleteProperty = (id: string, name: string) => {
    setDeleteError(null);
    setConfirmDeleteModal({ id, name });
  };

  // Tutup modal konfirmasi hapus
  const closeConfirmDeleteModal = () => {
    if (deletingPropertyId) return; // jangan tutup saat proses berjalan
    setConfirmDeleteModal(null);
    setDeleteError(null);
  };

  // Escape key untuk tutup modal konfirmasi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirmDeleteModal();
    };
    if (confirmDeleteModal) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmDeleteModal, deletingPropertyId]);

  // Handler eksekusi hapus properti setelah konfirmasi
  const confirmDeleteProperty = async () => {
    if (!confirmDeleteModal) return;
    const { id } = confirmDeleteModal;

    try {
      setDeletingPropertyId(id);
      setDeleteError(null);
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (data && data.success) {
        setConfirmDeleteModal(null);
        setProperties((prev) => prev.filter((p) => p.id !== id));
      } else {
        setDeleteError(data.error || "Gagal menghapus properti.");
      }
    } catch (err) {
      console.error("Error deleting property:", err);
      setDeleteError("Terjadi kesalahan koneksi saat menghapus properti.");
    } finally {
      setDeletingPropertyId(null);
    }
  };

  // Render Loading...
  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Memuat data properti...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Daftar Kos &amp; Manajemen Properti
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kelola properti terdaftar, harga sewa, tipe kamar, dan fasilitas kos.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Tambah Properti</span>
          </button>
        </div>

        {/* Status Notification Alert */}
        {statusAlert && (
          <div
            className={`p-4 border-b flex items-center justify-between text-xs font-semibold ${
              statusAlert.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusAlert.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{statusAlert.message}</span>
            </div>
            <button
              onClick={() => setStatusAlert(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedStatusTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedStatusTab === "ALL"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <span>Semua Kos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black">
              {properties.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("PENDING_REVIEW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedStatusTab === "PENDING_REVIEW"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
            }`}
          >
            <span>Butuh Persetujuan</span>
            {properties.filter((p) => (p.status || "PENDING_REVIEW") === "PENDING_REVIEW").length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-black">
                {properties.filter((p) => (p.status || "PENDING_REVIEW") === "PENDING_REVIEW").length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("PUBLISHED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedStatusTab === "PUBLISHED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50"
            }`}
          >
            <span>Disetujui / Aktif</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-black">
              {properties.filter((p) => p.status === "PUBLISHED").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusTab("REJECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedStatusTab === "REJECTED"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50"
            }`}
          >
            <span>Ditolak</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-black">
              {properties.filter((p) => p.status === "REJECTED").length}
            </span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Nama Kos</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Nama Pemilik</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Tipe Kos</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Harga</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Kapasitas</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Status Review</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {properties
                .filter((prop) => {
                  const effectiveStatus = prop.status || "PENDING_REVIEW";
                  if (selectedStatusTab === "ALL") return true;
                  return effectiveStatus === selectedStatusTab;
                })
                .map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-white">{prop.name}</span>
                        {prop.is_featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <Award size={10} className="text-amber-600 dark:text-amber-400" />
                            <span>Unggulan</span>
                          </span>
                        )}
                      </div>
                      {(prop.is_24_hours || prop.is_pet_friendly) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {prop.is_24_hours && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                              <Clock size={10} className="text-slate-500" />
                              <span>24 Jam</span>
                            </span>
                          )}
                          {prop.is_pet_friendly && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                              <PawPrint size={10} className="text-emerald-600" />
                              <span>Pet Friendly</span>
                            </span>
                          )}
                        </div>
                      )}
                      {prop.facilities && (
                        <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                          {prop.facilities}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700 dark:text-slate-200">
                        {prop.owner?.name || "-"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {prop.owner?.whatsapp_number || "-"}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          prop.gender_type === "PUTRI"
                            ? "bg-pink-100 text-pink-700"
                            : prop.gender_type === "PUTRA"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {prop.gender_type || "CAMPUR"}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">
                      <div>
                        {prop.price_per_month
                          ? `Rp ${prop.price_per_month.toLocaleString("id-ID")}/bln`
                          : "-"}
                      </div>
                      {prop.room_types && prop.room_types.length > 1 && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                          {prop.room_types.length} Tipe Kamar
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold ${
                          prop.available_rooms > 0
                            ? "bg-green-100 text-green-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800/60"
                            : "bg-red-100 text-red-700 dark:bg-rose-950/50 dark:text-rose-300 dark:border dark:border-rose-800/60"
                        }`}
                      >
                        {prop.available_rooms} Kamar
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {prop.status === "PUBLISHED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Aktif (Disetujui)</span>
                        </span>
                      ) : prop.status === "REJECTED" ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <X size={12} className="text-rose-600" />
                            <span>Ditolak</span>
                          </span>
                          {prop.rejectionReason && (
                            <span
                              className="text-[10px] text-rose-600 hover:underline cursor-pointer max-w-[150px] truncate mt-1"
                              title={prop.rejectionReason}
                              onClick={() => handleOpenRejectModal(prop)}
                            >
                              Alasan: {prop.rejectionReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock size={12} className="text-amber-600" />
                          <span>Menunggu Review</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Tombol Aksi Persetujuan / Review */}
                        {(prop.status === "PENDING_REVIEW" || !prop.status) && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdatingStatusId === prop.id}
                              onClick={() => handleApproveProperty(prop)}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 hover:shadow-sm hover:-translate-y-px active:scale-95 disabled:hover:translate-y-0 disabled:active:scale-100 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="Setujui dan Publikasikan Kos"
                            >
                              {isUpdatingStatusId === prop.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              <span>Setujui</span>
                            </button>

                            <button
                              type="button"
                              disabled={isUpdatingStatusId === prop.id}
                              onClick={() => handleOpenRejectModal(prop)}
                              className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:-translate-y-px active:scale-95 disabled:hover:translate-y-0 disabled:active:scale-100 text-rose-700 dark:text-rose-400 disabled:opacity-50 border border-rose-200 dark:border-rose-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                              title="Tolak Properti Kos"
                            >
                              <X size={12} />
                              <span>Tolak</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenFeaturedModal(prop)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shadow-xs hover:-translate-y-px active:scale-95 ${
                            prop.is_featured
                              ? "bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                              : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                          title={prop.is_featured ? "Kelola Status Rekomendasi (Aktif)" : "Jadikan Kos Rekomendasi"}
                        >
                          <Award size={12} className={prop.is_featured ? "text-amber-600 dark:text-amber-400" : "text-slate-400"} />
                          <span>{prop.is_featured ? "Unggulan" : "Promote"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(prop)}
                          className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-px active:scale-95 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
                          title="Edit Properti"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          disabled={deletingPropertyId === prop.id}
                          onClick={() => handleDeleteProperty(prop.id, prop.name)}
                          className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:-translate-y-px active:scale-95 disabled:hover:translate-y-0 disabled:active:scale-100 disabled:opacity-50 text-rose-600 dark:text-rose-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-rose-200 dark:border-rose-800 shadow-xs"
                          title="Hapus Properti"
                        >
                          {deletingPropertyId === prop.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Belum ada data kos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PROPERTI */}
      <PropertyModalForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        role="admin"
        editingProperty={editingProperty}
        onSuccess={() => {
          fetchProperties();
          handleCloseModal();
        }}
        owners={owners}
      />

      {/* Modal Konfirmasi Hapus Properti */}
      {confirmDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={closeConfirmDeleteModal}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-rose-50/70 dark:bg-rose-950/30">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Hapus Properti</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus properti{" "}
                <span className="font-bold text-slate-800 dark:text-white">
                  &ldquo;{confirmDeleteModal.name}&rdquo;
                </span>
                ? Semua data, media, dan booking terkait akan{" "}
                <span className="text-rose-600 dark:text-rose-400 font-semibold">dihapus secara permanen</span>.
              </p>
              {/* Error inline */}
              {deleteError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-5 pb-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={!!deletingPropertyId}
                onClick={closeConfirmDeleteModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!!deletingPropertyId}
                onClick={confirmDeleteProperty}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {deletingPropertyId ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Penolakan Properti Kos */}
      {rejectModalOpen && propertyToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle size={20} />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Tolak Properti Kos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Anda akan menolak pengajuan properti{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  &quot;{propertyToReject.name}&quot;
                </span>
                . Mohon tuliskan alasan penolakan secara jelas agar pemilik kos dapat memperbaiki datanya.
              </p>

              {rejectModalError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{rejectModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">
                  Alasan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Contoh: Foto tampak depan kos buram, alamat belum lengkap, atau harga tidak sesuai standar..."
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 resize-y font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={isUpdatingStatusId === propertyToReject.id}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectProperty}
                disabled={isUpdatingStatusId === propertyToReject.id}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingStatusId === propertyToReject.id ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <X size={13} />
                    <span>Kirim Penolakan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA STATUS FEATURED (ADMIN) */}
      {featuredModalProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Award size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    Kelola Kos Rekomendasi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {featuredModalProperty.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeaturedModalProperty(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {featuredModalError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{featuredModalError}</span>
                </div>
              )}

              {/* Status Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    Status Featured / Rekomendasi
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {featuredActiveInput ? "Kos ditampilkan sebagai rekomendasi" : "Status rekomendasi nonaktif"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredActiveInput}
                    onChange={(e) => setFeaturedActiveInput(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Masa Berlaku (Jika Aktif) */}
              {featuredActiveInput && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Durasi Berlaku Rekomendasi:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { days: 7, label: "7 Hari" },
                      { days: 14, label: "14 Hari" },
                      { days: 30, label: "30 Hari" },
                      { days: 90, label: "90 Hari" },
                      { days: 0, label: "Permanen" },
                    ].map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setFeaturedDurationDays(opt.days)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          featuredDurationDays === opt.days
                            ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 ring-2 ring-amber-500/20"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {featuredModalProperty.featured_until && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      Masa aktif saat ini: berakhir{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(featuredModalProperty.featured_until).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFeaturedModalProperty(null)}
                disabled={isUpdatingFeatured}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveFeatured}
                disabled={isUpdatingFeatured}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingFeatured ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Award size={13} />
                    <span>Simpan Status</span>
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
