"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2, Building, ShieldCheck, ArrowRight, User } from "lucide-react";

interface ChatRoomItem {
  id: string;
  property_id: string;
  property_name: string;
  property_image: string | null;
  property_price: number;
  other_party_name: string;
  other_party_avatar: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
  created_at: string;
}

export default function StudentChatListPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/chat");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success) {
          setRooms(data.rooms || []);
        } else if (data) {
          setErrorMsg(data.error || "Gagal memuat daftar obrolan.");
        }
      })
      .catch(() => {
        setErrorMsg("Gagal terhubung ke server chat.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 text-emerald-600" />
          Pesan &amp; Obrolan Saya
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Daftar obrolan langsung Anda dengan pengelola kos dengan perlindungan privasi kontak.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-semibold">Memuat riwayat obrolan...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-rose-500 text-xs">{errorMsg}</div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada obrolan aktif</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Anda dapat memulai percakapan dengan pengelola kos melalui tombol &quot;Chat Pengelola&quot; di halaman detail kos.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              <span>Cari Kos Nyaman</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          rooms.map((room) => (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <Building className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {room.other_party_name}
                    </h3>
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate mb-1">
                    {room.property_name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {room.last_message_preview || "Belum ada pesan"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <span className="text-[11px] text-slate-400 block">{formatTime(room.last_message_at)}</span>
                {room.unread_count > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                    {room.unread_count} baru
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
