"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  MessageSquare,
  Loader2,
  Building2,
  Calendar,
  Link2,
  Copy,
  Check,
  X,
  CheckCircle2,
  Plus,
  UserPlus,
  Pencil,
  Trash2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface OwnerItem {
  id: string;
  name: string;
  whatsapp_number: string;
  created_at: string;
  _count?: {
    properties: number;
  };
  properties?: Array<{
    id: string;
    name: string;
  }>;
}

interface GeneratedModalData {
  link: string;
  ownerName: string;
  ownerPhone: string;
}

export default function AdminOwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<OwnerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedModal, setGeneratedModal] = useState<GeneratedModalData | null>(null);
  const [copied, setCopied] = useState(false);

  // State Modal Tambah Pemilik
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: "", whatsapp_number: "" });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // State Modal Edit Pemilik
  const [editingOwner, setEditingOwner] = useState<OwnerItem | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", whatsapp_number: "" });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // State Modal Hapus Pemilik
  const [confirmDeleteOwner, setConfirmDeleteOwner] = useState<{
    id: string;
    name: string;
    propertyCount: number;
  } | null>(null);
  const [isDeletingOwner, setIsDeletingOwner] = useState(false);
  const [deleteOwnerError, setDeleteOwnerError] = useState<string | null>(null);

  const fetchOwners = useCallback(async () => {
    try {
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
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  // Listener tombol Escape untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (generatedModal) {
          setGeneratedModal(null);
          setCopied(false);
        }
        if (isAddModalOpen && !isSubmittingAdd) {
          setIsAddModalOpen(false);
          setAddError(null);
        }
        if (editingOwner && !isSubmittingEdit) {
          setEditingOwner(null);
          setEditError(null);
        }
        if (confirmDeleteOwner && !isDeletingOwner) {
          setConfirmDeleteOwner(null);
          setDeleteOwnerError(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    generatedModal,
    isAddModalOpen,
    isSubmittingAdd,
    editingOwner,
    isSubmittingEdit,
    confirmDeleteOwner,
    isDeletingOwner,
  ]);

  // Client-side filtering
  const filteredOwners = useMemo(() => {
    if (!searchQuery.trim()) return owners;
    const query = searchQuery.toLowerCase();
    return owners.filter(
      (owner) =>
        owner.name.toLowerCase().includes(query) ||
        owner.whatsapp_number.toLowerCase().includes(query)
    );
  }, [owners, searchQuery]);

  const formatWhatsAppNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return cleaned;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "-";
    }
  };

  const handleGenerateLink = async (owner: OwnerItem) => {
    if (generatingId) return;
    setGeneratingId(owner.id);

    try {
      const res = await fetch("/api/magic-link/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ownerId: owner.id }),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.magicLink) {
        setGeneratedModal({
          link: data.magicLink,
          ownerName: owner.name,
          ownerPhone: owner.whatsapp_number,
        });
      } else {
        alert(data.error || "Gagal membuat magic link");
      }
    } catch (err) {
      console.error("Error generating magic link:", err);
      alert("Terjadi kesalahan koneksi saat membuat magic link");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedModal?.link) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedModal.link);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handler Tambah Pemilik
  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name.trim() || !addFormData.whatsapp_number.trim()) {
      setAddError("Nama dan nomor WhatsApp wajib diisi.");
      return;
    }

    setIsSubmittingAdd(true);
    setAddError(null);

    try {
      const res = await fetch("/api/admin/owners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: addFormData.name.trim(),
          whatsapp_number: addFormData.whatsapp_number.trim(),
        }),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setOwners((prev) => [data.data, ...prev]);
        setIsAddModalOpen(false);
        setAddFormData({ name: "", whatsapp_number: "" });
      } else {
        setAddError(data.error || "Gagal menambahkan pemilik.");
      }
    } catch (err) {
      console.error("Error adding owner:", err);
      setAddError("Terjadi kesalahan koneksi saat menambahkan pemilik.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handler Buka Modal Edit
  const handleOpenEditModal = (owner: OwnerItem) => {
    setEditingOwner(owner);
    setEditFormData({
      name: owner.name,
      whatsapp_number: owner.whatsapp_number,
    });
    setEditError(null);
  };

  // Handler Update Pemilik
  const handleUpdateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOwner) return;

    if (!editFormData.name.trim() || !editFormData.whatsapp_number.trim()) {
      setEditError("Nama dan nomor WhatsApp tidak boleh kosong.");
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/owners/${editingOwner.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          whatsapp_number: editFormData.whatsapp_number.trim(),
        }),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setOwners((prev) =>
          prev.map((o) => (o.id === editingOwner.id ? { ...o, ...data.data } : o))
        );
        setEditingOwner(null);
        setEditFormData({ name: "", whatsapp_number: "" });
      } else {
        setEditError(data.error || "Gagal memperbarui data pemilik.");
      }
    } catch (err) {
      console.error("Error updating owner:", err);
      setEditError("Terjadi kesalahan koneksi saat memperbarui pemilik.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handler Hapus Pemilik
  const confirmDeleteOwnerAction = async () => {
    if (!confirmDeleteOwner) return;

    setIsDeletingOwner(true);
    setDeleteOwnerError(null);

    try {
      const res = await fetch(`/api/admin/owners/${confirmDeleteOwner.id}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setOwners((prev) => prev.filter((o) => o.id !== confirmDeleteOwner.id));
        setConfirmDeleteOwner(null);
      } else {
        setDeleteOwnerError(data.error || "Gagal menghapus pemilik kos.");
      }
    } catch (err) {
      console.error("Error deleting owner:", err);
      setDeleteOwnerError("Terjadi kesalahan koneksi saat menghapus pemilik.");
    } finally {
      setIsDeletingOwner(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Memuat data pemilik kos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-slate-800" />
            <span>Manajemen Pemilik Kos</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar seluruh pemilik kos (Ibu/Bapak Kos) yang terdaftar di platform KosPasti.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
            />
          </div>

          {/* Tombol Tambah Pemilik */}
          <button
            type="button"
            onClick={() => {
              setAddFormData({ name: "", whatsapp_number: "" });
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pemilik</span>
          </button>
        </div>
      </div>

      {/* Owners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total {filteredOwners.length} Pemilik Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200">Nama Pemilik</th>
                <th className="p-4 border-b border-slate-200">Nomor WhatsApp</th>
                <th className="p-4 border-b border-slate-200 text-center">Jumlah Properti</th>
                <th className="p-4 border-b border-slate-200">Tanggal Terdaftar</th>
                <th className="p-4 border-b border-slate-200 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOwners.map((owner) => {
                const propertyCount =
                  owner._count?.properties ?? owner.properties?.length ?? 0;
                const isGenerating = generatingId === owner.id;

                return (
                  <tr key={owner.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{owner.name}</div>
                      {owner.properties && owner.properties.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {owner.properties.map((p) => p.name).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700 font-mono text-xs">
                        {owner.whatsapp_number}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {propertyCount} Kos
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(owner.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Tombol Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(owner)}
                          disabled={generatingId !== null || isDeletingOwner}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Pemilik"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        {/* Tombol Generate Magic Link */}
                        <button
                          type="button"
                          onClick={() => handleGenerateLink(owner)}
                          disabled={generatingId !== null || isDeletingOwner}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                          title="Buat Magic Link Baru"
                        >
                          {isGenerating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span>{isGenerating ? "Memproses..." : "Generate Link"}</span>
                        </button>

                        {/* Tombol Chat WA */}
                        <a
                          href={`https://wa.me/${formatWhatsAppNumber(owner.whatsapp_number)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat WA</span>
                        </a>

                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteOwner({
                              id: owner.id,
                              name: owner.name,
                              propertyCount,
                            });
                            setDeleteOwnerError(null);
                          }}
                          disabled={generatingId !== null || isDeletingOwner}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Pemilik"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    {searchQuery
                      ? `Tidak ditemukan pemilik kos dengan kata kunci "${searchQuery}".`
                      : "Belum ada data pemilik kos terdaftar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah Pemilik */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-owner-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => {
            if (!isSubmittingAdd) {
              setIsAddModalOpen(false);
              setAddError(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="add-owner-modal-title" className="text-lg font-bold text-slate-900">
                    Tambah Pemilik Kos Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan pemilik kos baru ke dalam sistem
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingAdd}
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddOwner} className="p-6 space-y-4">
              {addError && (
                <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="add-owner-name" className="text-xs font-semibold text-slate-700">
                  Nama Pemilik <span className="text-rose-500">*</span>
                </label>
                <input
                  id="add-owner-name"
                  type="text"
                  required
                  placeholder="Contoh: Ibu Hj. Siti Aminah"
                  value={addFormData.name}
                  onChange={(e) =>
                    setAddFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="add-owner-whatsapp" className="text-xs font-semibold text-slate-700">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  id="add-owner-whatsapp"
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={addFormData.whatsapp_number}
                  onChange={(e) =>
                    setAddFormData((prev) => ({
                      ...prev,
                      whatsapp_number: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Nomor ini digunakan untuk kontak dan login via Magic Link WhatsApp.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingAdd}
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddError(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isSubmittingAdd ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Tambah Pemilik</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Edit Pemilik */}
      {editingOwner && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-owner-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => {
            if (!isSubmittingEdit) {
              setEditingOwner(null);
              setEditError(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="edit-owner-modal-title" className="text-lg font-bold text-slate-900">
                    Edit Data Pemilik Kos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui nama atau nomor WhatsApp pemilik
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingEdit}
                onClick={() => {
                  setEditingOwner(null);
                  setEditError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateOwner} className="p-6 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="edit-owner-name" className="text-xs font-semibold text-slate-700">
                  Nama Pemilik <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit-owner-name"
                  type="text"
                  required
                  placeholder="Nama Pemilik Kos"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-owner-whatsapp" className="text-xs font-semibold text-slate-700">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit-owner-whatsapp"
                  type="text"
                  required
                  placeholder="08xxxxxxxxxx"
                  value={editFormData.whatsapp_number}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      whatsapp_number: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingEdit}
                  onClick={() => {
                    setEditingOwner(null);
                    setEditError(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pemilik */}
      {confirmDeleteOwner && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-owner-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => {
            if (!isDeletingOwner) {
              setConfirmDeleteOwner(null);
              setDeleteOwnerError(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-rose-50/70">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-owner-modal-title" className="font-bold text-slate-800 text-base">Hapus Pemilik Kos</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus pemilik{" "}
                <span className="font-bold text-slate-800">
                  &ldquo;{confirmDeleteOwner.name}&rdquo;
                </span>
                ?
              </p>

              {/* Warning jika punya properti */}
              {confirmDeleteOwner.propertyCount > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Peringatan Data Terkait:</span>
                  </div>
                  <p className="leading-relaxed">
                    Pemilik ini memiliki{" "}
                    <span className="font-bold underline">
                      {confirmDeleteOwner.propertyCount} properti kos
                    </span>{" "}
                    yang juga akan <span className="font-semibold text-rose-700">ikut terhapus</span> beserta seluruh data booking, media foto/video, dan magic link terkait.
                  </p>
                </div>
              )}

              {/* Error inline */}
              {deleteOwnerError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteOwnerError}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-5 pb-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingOwner}
                onClick={() => {
                  setConfirmDeleteOwner(null);
                  setDeleteOwnerError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingOwner}
                onClick={confirmDeleteOwnerAction}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {isDeletingOwner ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tautan Magic Link */}
      {generatedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="magic-link-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => {
            setGeneratedModal(null);
            setCopied(false);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="magic-link-modal-title" className="text-lg font-bold text-slate-900">
                    Tautan Magic Link Berhasil Dibuat!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Untuk pemilik: <span className="font-semibold text-slate-700">{generatedModal.ownerName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGeneratedModal(null);
                  setCopied(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                URL Magic Link (Berlaku 24 Jam):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedModal.link}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none select-all break-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    copied
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                  title="Salin ke Clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Perhatian Keamanan:</p>
              <p className="text-amber-700 leading-relaxed">
                Tautan ini memberikan akses langsung bagi pemilik untuk memperbarui data kos tanpa login. Tautan lama otomatis kedaluwarsa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <a
                href={`https://wa.me/${formatWhatsAppNumber(generatedModal.ownerPhone)}?text=${encodeURIComponent(
                  `Halo ${generatedModal.ownerName},\n\nBerikut adalah tautan rahasia (Magic Link) untuk mengakses dan memperbarui data properti kos Anda di platform KosPasti.\n\n🔗 Tautan: ${generatedModal.link}\n\n⚠️ Catatan: Tautan ini memberikan akses langsung tanpa login dan hanya berlaku selama 24 jam ke depan. Mohon jangan bagikan tautan ini kepada orang lain.\n\nTerima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirim via WA</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setGeneratedModal(null);
                  setCopied(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
