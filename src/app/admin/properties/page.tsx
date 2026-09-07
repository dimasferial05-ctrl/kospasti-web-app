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

interface PropertyAdminItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  media?: PropertyMediaItem[];
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
}

const initialFormData: PropertyFormData = {
  name: "",
  owner_id: "",
  price_per_month: "",
  available_rooms: "0",
  gender_type: "CAMPUR",
  facilities: "",
  image_url: "",
};

export default function ManagePropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyAdminItem[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // State Modal Form (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyAdminItem | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
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
      name: "",
      owner_id: owners.length > 0 ? owners[0].id : "",
      price_per_month: "",
      available_rooms: "0",
      gender_type: "CAMPUR",
      facilities: "",
      image_url: "",
    });
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
    });
    setSelectedFiles([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Tutup Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
    setFormData(initialFormData);
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
    if (!formData.facilities.trim()) {
      setFormError("Fasilitas kos wajib diisi.");
      return;
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
      data.append("price_per_month", formData.price_per_month);
      data.append("available_rooms", formData.available_rooms);
      data.append("gender_type", formData.gender_type);
      data.append("facilities", formData.facilities.trim());
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
          <table className="w-full text-left text-sm">
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
                    {prop.facilities && (
                      <div className="text-xs text-slate-400 truncate max-w-xs">
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
                    {prop.price_per_month
                      ? `Rp ${prop.price_per_month.toLocaleString("id-ID")}/bln`
                      : "-"}
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
                        ) : copiedId === prop.id ? (
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

      {/* Modal Dialog Form Tambah & Edit Properti */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingProperty ? "Edit Properti Kos" : "Tambah Properti Kos Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingProperty
                      ? "Perbarui informasi dan spesifikasi kos."
                      : "Lengkapi data untuk mendaftarkan properti kos baru."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-600 font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Kos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Kos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kos Melati Asri"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              {/* Pemilik Kos (Dropdown Owner) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pemilik Kos (Owner) <span className="text-red-500">*</span>
                </label>
                {isLoadingOwners ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Memuat daftar pemilik kos...</span>
                  </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Harga Per Bulan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Harga / Bulan (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 850000"
                    value={formData.price_per_month}
                    onChange={(e) =>
                      setFormData({ ...formData, price_per_month: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>

                {/* Tipe Kos */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tipe Kos <span className="text-red-500">*</span>
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
              </div>

              {/* Jumlah Kamar Tersedia */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jumlah Kamar Tersedia <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Contoh: 5"
                  value={formData.available_rooms}
                  onChange={(e) =>
                    setFormData({ ...formData, available_rooms: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              {/* Fasilitas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fasilitas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AC, WiFi, Kamar Mandi Dalam, Kasur"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Gunakan tanda koma (,) untuk memisahkan antar fasilitas.
                </p>
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

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
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
    </div>
  );
}
