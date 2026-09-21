"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  Plus,
  Pencil,
  X,
  Building2,
  AlertCircle,
  FileText,
  Trash2,
  Star,
  Play,
  Clock,
  Sparkles,
  MapPin,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

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
  image_url?: string | null;
}

interface RoomTypeFormItem {
  id?: string;
  name: string;
  price_per_month: string;
  available_rooms: string;
  facilities: string;
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
  media?: PropertyMediaItem[];
  room_types?: RoomTypeAdminItem[];
  owner_id: string;
  owner?: OwnerOption | null;
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
};

export default function ManagePropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyAdminItem[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    });
    setRoomTypes([
      {
        name: "Tipe A (Standar)",
        price_per_month: "",
        available_rooms: "1",
        facilities: "",
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
        prop.image_url && !prop.image_url.startsWith("/uploads/")
          ? prop.image_url
          : "",
      address: prop.address || "",
      latitude: prop.latitude !== undefined && prop.latitude !== null ? String(prop.latitude) : "",
      longitude: prop.longitude !== undefined && prop.longitude !== null ? String(prop.longitude) : "",
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
        alert(resData.error || "Gagal mengatur thumbnail.");
      }
    } catch (err) {
      console.error("Error setting thumbnail:", err);
      alert("Terjadi kesalahan koneksi saat mengatur thumbnail.");
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
        alert(resData.error || "Gagal menghapus media.");
      }
    } catch (err) {
      console.error("Error deleting media:", err);
      alert("Terjadi kesalahan koneksi saat menghapus media.");
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

  // Fungsi untuk membuat dan menyalin Magic Link via API
  const handleCopyLink = async (ownerId: string | undefined, propertyId: string) => {
    if (!ownerId) {
      alert("Owner tidak ditemukan untuk properti ini.");
      return;
    }

    try {
      setLoadingId(propertyId);
      const res = await fetch("/api/magic-link/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ownerId }),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();

      if (data.success && data.magicLink) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(data.magicLink);
        }
        setCopiedId(propertyId);
        setTimeout(() => setCopiedId(null), 2000); // Reset notifikasi setelah 2 detik
      } else {
        console.error("Gagal membuat magic link:", data.error);
        alert(data.error || "Gagal membuat magic link");
      }
    } catch (err) {
      console.error("Error generating magic link:", err);
      alert("Terjadi kesalahan koneksi saat membuat magic link.");
    } finally {
      setLoadingId(null);
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
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Memuat data properti...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Daftar Kos &amp; Manajemen Link
            </h2>
            <p className="text-sm text-slate-500">
              Kelola properti terdaftar dan kirimkan magic link update kamar ke pemilik kos.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Tambah Properti</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200">Nama Kos</th>
                <th className="p-4 border-b border-slate-200">Nama Pemilik</th>
                <th className="p-4 border-b border-slate-200 text-center">Tipe Kos</th>
                <th className="p-4 border-b border-slate-200">Harga</th>
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
                    {(prop.is_24_hours || prop.is_pet_friendly) && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {prop.is_24_hours && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                            <Clock size={10} className="text-slate-500" />
                            <span>24 Jam</span>
                          </span>
                        )}
                        {prop.is_pet_friendly && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            <Sparkles size={10} className="text-emerald-600" />
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
                    <div className="font-medium text-slate-700">
                      {prop.owner?.name || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
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
                  <td className="p-4 font-semibold text-slate-700">
                    <div>
                      {prop.price_per_month
                        ? `Rp ${prop.price_per_month.toLocaleString("id-ID")}/bln`
                        : "-"}
                    </div>
                    {prop.room_types && prop.room_types.length > 1 && (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        {prop.room_types.length} Tipe Kamar
                      </span>
                    )}
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
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(prop)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-200"
                        title="Edit Properti"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        disabled={deletingPropertyId === prop.id}
                        onClick={() => handleDeleteProperty(prop.id, prop.name)}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-rose-50 disabled:opacity-50 text-rose-600 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-rose-200"
                        title="Hapus Properti"
                      >
                        {deletingPropertyId === prop.id ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Menghapus...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={13} />
                            <span>Hapus</span>
                          </>
                        )}
                      </button>
                      <button
                        disabled={loadingId === prop.id}
                        onClick={() => handleCopyLink(prop.owner?.id || prop.owner_id, prop.id)}
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Copy Magic Link Pemilik Kos"
                      >
                        {loadingId === prop.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Membuat Link...</span>
                          </>
                        ) : (
                          <>
                            <LinkIcon size={13} />
                            <span>
                              {copiedId === (prop.owner?.id || prop.owner_id)
                                ? "Tersalin!"
                                : "Link Pemilik"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Belum ada data kos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PROPERTI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <h3 className="font-bold text-slate-800 text-base">
                {editingProperty ? "Edit Properti Kos" : "Tambah Properti Kos Baru"}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body & Footer in Form */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

              {/* Nama Properti */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Properti Kos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kos Mawar Indah"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              {/* Pemilik Kos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pemilik Kos (Owner) <span className="text-red-500">*</span>
                </label>
                {isLoadingOwners ? (
                  <div className="text-xs text-slate-400 py-2">Memuat daftar pemilik...</div>
                ) : (
                  <select
                    required
                    value={formData.owner_id}
                    onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="" disabled>
                      -- Pilih Pemilik Kos --
                    </option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.whatsapp_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tipe Kos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipe Kos (Gender) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender_type}
                  onChange={(e) => setFormData({ ...formData, gender_type: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="PUTRA">Putra</option>
                  <option value="PUTRI">Putri</option>
                  <option value="CAMPUR">Campur</option>
                </select>
              </div>

              {/* Seksi Manajemen Tipe Kamar */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Tipe Kamar Kos
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Kelola daftar tipe kamar, harga, dan sisa kamar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRoomTypes([
                        ...roomTypes,
                        {
                          name: `Tipe ${String.fromCharCode(65 + roomTypes.length)}`,
                          price_per_month: "",
                          available_rooms: "1",
                          facilities: "",
                          image_url: "",
                          image_file: null,
                          image_preview: null,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Tambah Tipe</span>
                  </button>
                </div>

                <div className="space-y-3 mt-2">
                  {roomTypes.map((rt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Tipe #{idx + 1}
                        </span>
                        {roomTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setRoomTypes(roomTypes.filter((_, rIdx) => rIdx !== idx))
                            }
                            className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nama Tipe <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Tipe A (AC)"
                            value={rt.name}
                            onChange={(e) => {
                              const updated = [...roomTypes];
                              updated[idx].name = e.target.value;
                              setRoomTypes(updated);
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Harga/Bln (Rp) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Contoh: 850000"
                            value={rt.price_per_month}
                            onChange={(e) => {
                              const updated = [...roomTypes];
                              updated[idx].price_per_month = e.target.value;
                              setRoomTypes(updated);
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Sisa Kamar <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Contoh: 3"
                            value={rt.available_rooms}
                            onChange={(e) => {
                              const updated = [...roomTypes];
                              updated[idx].available_rooms = e.target.value;
                              setRoomTypes(updated);
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Fasilitas Khusus Kamar Ini (Opsional)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: AC, Kasur Springbed, Kamar Mandi Dalam"
                          value={rt.facilities}
                          onChange={(e) => {
                            const updated = [...roomTypes];
                            updated[idx].facilities = e.target.value;
                            setRoomTypes(updated);
                          }}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                        />
                      </div>

                      {/* Foto Tipe Kamar (Unggah File atau URL) */}
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Foto Kamar Tipe Ini (Unggah File / URL)
                        </label>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          {/* Preview Thumbnail */}
                          {rt.image_preview || rt.image_url ? (
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={rt.image_preview || rt.image_url}
                                alt={rt.name}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...roomTypes];
                                  updated[idx].image_url = "";
                                  updated[idx].image_file = null;
                                  updated[idx].image_preview = null;
                                  setRoomTypes(updated);
                                }}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                title="Hapus foto ini"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                              <ImageIcon size={16} />
                            </div>
                          )}

                          {/* Upload / URL Inputs */}
                          <div className="flex-1 space-y-1.5 w-full min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer border border-blue-200/80 transition-colors">
                                <Upload size={13} />
                                <span>{rt.image_file ? "Ganti File Foto" : "Pilih File Foto"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const previewUrl = URL.createObjectURL(file);
                                      const updated = [...roomTypes];
                                      updated[idx].image_file = file;
                                      updated[idx].image_preview = previewUrl;
                                      updated[idx].image_url = "";
                                      setRoomTypes(updated);
                                    }
                                  }}
                                />
                              </label>
                              {rt.image_file && (
                                <span className="text-[11px] text-slate-600 truncate max-w-[160px]">
                                  {rt.image_file.name}
                                </span>
                              )}
                            </div>

                            <input
                              type="url"
                              placeholder="Atau tempel URL gambar (https://...)"
                              value={rt.image_url || ""}
                              onChange={(e) => {
                                const updated = [...roomTypes];
                                updated[idx].image_url = e.target.value;
                                updated[idx].image_file = null;
                                updated[idx].image_preview = e.target.value || null;
                                setRoomTypes(updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fasilitas Umum / Bersama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fasilitas Umum / Bangunan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: WiFi, Dapur Bersama, Parkir Motor, CCTV"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Fasilitas yang bisa digunakan bersama oleh semua penghuni. Gunakan tanda koma (,) untuk memisahkan.
                </p>
              </div>

              {/* Alamat & Koordinat Peta */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-500" />
                  <label className="block text-xs font-bold text-slate-800">
                    Lokasi &amp; Titik Koordinat (Opsional)
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Alamat Lengkap / Patokan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jl. Tebet Barat Dalam VII No. 12, Jakarta Selatan"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Latitude (Lintang)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: -6.2374"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Longitude (Bujur)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 106.8526"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Salin koordinat dari Google Maps (klik kanan pada lokasi kos &rarr; salin angka koordinat).
                </p>
              </div>

              {/* Kebijakan & Akses */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Kebijakan &amp; Akses Properti
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Akses 24 Jam */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      formData.is_24_hours
                        ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.is_24_hours}
                      onChange={(e) =>
                        setFormData({ ...formData, is_24_hours: e.target.checked })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                        formData.is_24_hours
                          ? "bg-white text-slate-900 border-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {formData.is_24_hours && (
                        <CheckCircle2 className="w-3.5 h-3.5 fill-slate-900 text-white" />
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Clock
                          size={13}
                          className={formData.is_24_hours ? "text-slate-300" : "text-slate-400"}
                        />
                        <span>Akses 24 Jam</span>
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          formData.is_24_hours ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        Bebas jam malam
                      </p>
                    </div>
                  </label>

                  {/* Pet Friendly */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      formData.is_pet_friendly
                        ? "bg-emerald-900 border-emerald-900 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.is_pet_friendly}
                      onChange={(e) =>
                        setFormData({ ...formData, is_pet_friendly: e.target.checked })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                        formData.is_pet_friendly
                          ? "bg-white text-emerald-900 border-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {formData.is_pet_friendly && (
                        <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-900 text-white" />
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Sparkles
                          size={13}
                          className={formData.is_pet_friendly ? "text-emerald-200" : "text-slate-400"}
                        />
                        <span>Pet Friendly</span>
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          formData.is_pet_friendly ? "text-emerald-200" : "text-slate-400"
                        }`}
                      >
                        Boleh bawa hewan
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Media Tersimpan (Hanya Tampil saat Edit Properti) */}
              {editingProperty && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Media Tersimpan ({editingProperty.media?.length || 0})
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Klik bintang untuk jadikan thumbnail
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
                              isThumbnail
                                ? "border-amber-400 ring-2 ring-amber-400/40"
                                : "border-slate-200"
                            } bg-black/5 aspect-video flex items-center justify-center`}
                          >
                            {item.type === "VIDEO" ? (
                              <div className="w-full h-full relative bg-slate-800 flex items-center justify-center">
                                <video
                                  src={item.url}
                                  className="w-full h-full object-cover pointer-events-none"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Play size={18} className="text-white fill-white" />
                                </div>
                              </div>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={item.url}
                                alt="Media property"
                                className="w-full h-full object-cover"
                              />
                            )}

                            {/* Badge Thumbnail */}
                            {isThumbnail && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 text-white rounded text-[9px] font-bold flex items-center gap-1 shadow-xs z-10">
                                <Star size={9} className="fill-white" />
                                <span>Thumbnail</span>
                              </div>
                            )}

                            {/* Action Overlay */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1 z-20">
                              {!isThumbnail && (
                                <button
                                  type="button"
                                  disabled={isSetting || isDeleting}
                                  onClick={() => handleSetThumbnail(item.url)}
                                  className="p-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Jadikan Thumbnail Utama"
                                >
                                  {isSetting ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Star size={12} />
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isDeleting || isSetting}
                                onClick={() => handleDeleteExistingMedia(item.id, item.url)}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Hapus Media"
                              >
                                {isDeleting ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
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

              {/* Multi-Upload Media (Gambar & Video) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unggah Media Baru (Gambar &amp; Video)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4,video/webm,video/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-1.5 bg-white cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Unggah beberapa gambar dan video sekaligus (MP4, WebM, JPG, PNG).
                </p>

                {/* Selected files preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-blue-600 shrink-0" />
                          <span className="truncate text-slate-700 font-medium">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(idx)}
                            className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* URL Gambar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  URL Gambar (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="Contoh: https://images.unsplash.com/photo-..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              </div>

              {/* Pinned Action Buttons Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingProperty ? "Simpan Perubahan" : "Tambah Properti"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Properti */}
      {confirmDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={closeConfirmDeleteModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-rose-50/70">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Hapus Properti</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus properti{" "}
                <span className="font-bold text-slate-800">
                  &ldquo;{confirmDeleteModal.name}&rdquo;
                </span>
                ? Semua data, media, dan booking terkait akan{" "}
                <span className="text-rose-600 font-semibold">dihapus secara permanen</span>.
              </p>
              {/* Error inline */}
              {deleteError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
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
    </div>
  );
}
