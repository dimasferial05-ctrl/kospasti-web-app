"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  User as UserIcon,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  X,
  Eye,
  BookmarkCheck,
} from "lucide-react";

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  avatar?: string | null;
  bio?: string | null;
  created_at: string;
  _count?: {
    bookings: number;
  };
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

  const initial = (name || "P").trim().charAt(0).toUpperCase();

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
        alt={name || "Avatar"}
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

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      })
      .catch((err) => {
        console.error("Fetch admin users error:", err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getCleanWhatsappUrl = (phone?: string | null) => {
    if (!phone) return "#";
    const cleaned = phone.replace(/\D/g, "");
    const formatted = cleaned.startsWith("0") ? "62" + cleaned.slice(1) : cleaned;
    return `https://wa.me/${formatted}`;
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = user.name?.toLowerCase().includes(q) || false;
    const emailMatch = user.email?.toLowerCase().includes(q) || false;
    const waMatch = user.whatsapp?.toLowerCase().includes(q) || false;
    return nameMatch || emailMatch || waMatch;
  });

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 font-medium flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Memuat data pengguna...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Manajemen Pengguna</h2>
          <p className="text-slate-500 text-sm">
            Daftar seluruh pencari kos yang terdaftar di platform KosPasti.
          </p>
        </div>
      </div>

      {/* Kontainer Utama Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari nama, email, atau WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500 shrink-0">
            Total: <span className="text-slate-800 font-bold">{filteredUsers.length}</span> Pengguna
          </div>
        </div>

        {/* Tabel Data Pengguna */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[850px]">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200">Pengguna</th>
                <th className="p-4 border-b border-slate-200">Email</th>
                <th className="p-4 border-b border-slate-200">Nomor WhatsApp</th>
                <th className="p-4 border-b border-slate-200">Bio</th>
                <th className="p-4 border-b border-slate-200 text-center">Total Booking</th>
                <th className="p-4 border-b border-slate-200 text-center">Terdaftar</th>
                <th className="p-4 border-b border-slate-200 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    {/* Kolom Avatar & Nama */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={user.avatar} name={user.name} size="md" />
                        <div>
                          <div className="font-bold text-slate-800">{user.name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kolom Email */}
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{user.email}</span>
                      </div>
                    </td>

                    {/* Kolom Nomor WhatsApp */}
                    <td className="p-4 text-slate-600">
                      {user.whatsapp ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{user.whatsapp}</span>
                          <a
                            href={getCleanWhatsappUrl(user.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold transition"
                            title="Kirim pesan WhatsApp langsung"
                          >
                            <MessageCircle size={12} />
                            <span>Chat</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Belum diisi</span>
                      )}
                    </td>

                    {/* Kolom Bio Singkat */}
                    <td className="p-4 text-slate-600 max-w-[200px]">
                      {user.bio ? (
                        <span className="text-xs italic line-clamp-2 text-slate-700" title={user.bio}>
                          &ldquo;{user.bio}&rdquo;
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>

                    {/* Kolom Total Booking */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                        <BookmarkCheck size={13} className="text-blue-600" />
                        <span>{user._count?.bookings ?? 0}</span>
                      </span>
                    </td>

                    {/* Kolom Tanggal Terdaftar */}
                    <td className="p-4 text-center text-xs text-slate-500 font-medium">
                      {new Date(user.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Kolom Aksi */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Lihat Detail Profil Pengguna"
                      >
                        <Eye size={14} />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {searchQuery
                      ? "Tidak ditemukan pengguna yang sesuai dengan kata kunci pencarian."
                      : "Belum ada data pengguna terdaftar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Profil Pengguna */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedUser(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-scaleUp"
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
                <h3 className="text-xl font-bold tracking-tight">{selectedUser.name}</h3>
                <p className="text-blue-100 text-xs mt-0.5 font-mono">ID: {selectedUser.id}</p>
              </div>
            </div>

            {/* Isi Konten Profil */}
            <div className="p-6 space-y-4">
              {/* Bio Singkat */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Bio / Deskripsi Profil
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 leading-relaxed italic">
                  {selectedUser.bio ? `"${selectedUser.bio}"` : "Pengguna belum menambahkan bio profil."}
                </div>
              </div>

              {/* Data Kontak */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                  <Mail size={18} className="text-slate-400 shrink-0" />
                  <div className="overflow-hidden">
                    <div className="text-xs text-slate-400 font-medium">Alamat Email</div>
                    <div className="text-slate-700 font-medium truncate">{selectedUser.email}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Nomor WhatsApp</div>
                      <div className="text-slate-700 font-medium">{selectedUser.whatsapp || "Tidak tersedia"}</div>
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

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                      <BookmarkCheck size={14} className="text-blue-600" />
                      <span>Total Booking</span>
                    </div>
                    <div className="text-base font-bold text-slate-800">
                      {selectedUser._count?.bookings ?? 0} Pesanan
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Terdaftar</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {new Date(selectedUser.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Tutup */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
