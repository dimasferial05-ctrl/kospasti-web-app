"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Send,
  Loader2,
  Building,
  User,
  ShieldCheck,
  Clock,
  CheckCheck,
  Search,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { subscribeToChatRoom, broadcastChatMessage } from "@/lib/supabase-client";

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

interface ChatMessageItem {
  id: string;
  room_id: string;
  sender_type: "USER" | "OWNER" | "SYSTEM";
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  is_self: boolean;
}

export default function PartnerChatsPage() {
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Rooms
  const fetchRooms = async (silent = false) => {
    if (!silent) setIsLoadingRooms(true);
    try {
      const res = await fetch("/api/chat/rooms");
      const data = await res.json();
      if (res.ok && data.success) {
        setRooms(data.rooms || []);
        // Jika belum ada room yang dipilih dan ada rooms, pilih yang pertama di desktop
        if (!selectedRoomId && data.rooms && data.rooms.length > 0) {
          if (typeof window !== "undefined" && window.innerWidth >= 768) {
            setSelectedRoomId(data.rooms[0].id);
          }
        }
      } else {
        if (!silent) setErrorMsg(data.error || "Gagal memuat percakapan.");
      }
    } catch {
      if (!silent) setErrorMsg("Gagal terhubung ke server chat.");
    } finally {
      if (!silent) setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 2. Fetch Messages saat selectedRoomId berubah
  const fetchMessages = async (roomId: string, silent = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages || []);
        setSelectedRoomDetails(data.room || null);
        // Kurangi unread count di local state rooms
        setRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r))
        );
      }
    } catch (err) {
      console.error("Gagal memuat pesan:", err);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!selectedRoomId) return;
    fetchMessages(selectedRoomId);

    // Pasang Supabase Realtime Channel
    const unsubscribe = subscribeToChatRoom(selectedRoomId, (newMsg) => {
      setMessages((prev) => {
        // Cegah duplikasi jika pesan sudah ada
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, { ...newMsg, is_self: newMsg.sender_type === "OWNER" }];
      });
      // Update preview pesan di daftar room
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoomId
            ? { ...r, last_message_preview: newMsg.content, last_message_at: newMsg.created_at }
            : r
        )
      );
    });

    // Fallback polling setiap 5 detik untuk ketahanan jaringan
    const interval = setInterval(() => {
      fetchMessages(selectedRoomId, true);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedRoomId]);

  // Scroll otomatis ke pesan terbawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Kirim Pesan
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !selectedRoomId || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/chat/rooms/${selectedRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setInputText("");
        setMessages((prev) => [...prev, data.message]);

        // Broadcast pesan via Supabase Realtime ke mahasiswa
        await broadcastChatMessage(selectedRoomId, data.message);

        // Update list rooms
        setRooms((prev) =>
          prev.map((r) =>
            r.id === selectedRoomId
              ? { ...r, last_message_preview: trimmed, last_message_at: new Date().toISOString() }
              : r
          )
        );
      } else {
        alert(data.error || "Gagal mengirim pesan.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi saat mengirim pesan.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.other_party_name.toLowerCase().includes(q) ||
      r.property_name.toLowerCase().includes(q) ||
      (r.last_message_preview && r.last_message_preview.toLowerCase().includes(q))
    );
  });

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 text-emerald-500" />
          Pesan &amp; Obrolan Masuk
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tanya jawab langsung dengan calon penyewa secara instan dengan perlindungan privasi kontak.
        </p>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden h-[75vh] flex">
        {/* Left Column: Rooms List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 ${
            selectedRoomId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari penyewa atau kos..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Room Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoadingRooms ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                <p className="text-xs">Memuat obrolan...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-500">Belum ada pesan masuk.</p>
                <p className="text-[11px] text-slate-400">
                  Pertanyaan dari calon penyewa di halaman kos Anda akan muncul di sini.
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-500"
                        : ""
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                      {room.other_party_name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {room.other_party_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTime(room.last_message_at)}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate mb-1">
                        {room.property_name}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {room.last_message_preview || "Belum ada pesan"}
                        </p>
                        {room.unread_count > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold flex items-center justify-center shrink-0">
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 ${
            selectedRoomId ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedRoomId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomId(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 md:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <User className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {selectedRoomDetails?.other_party_name || "Calon Penyewa"}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{selectedRoomDetails?.property_name || "Properti Kos"}</span>
                    </p>
                  </div>
                </div>

                {/* Privacy Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Masking Privasi Aktif</span>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {/* Privacy Note Banner */}
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-800/40 text-center text-xs text-indigo-700 dark:text-indigo-300 space-y-1 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Perlindungan Privasi KosPasti</span>
                  </div>
                  <p className="text-[11px]">
                    Nomor WhatsApp kedua pihak disamarkan. Transaksi sewa dan deposit aman hanya melalui sistem Escrow KosPasti.
                  </p>
                </div>

                {isLoadingMessages ? (
                  <div className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs">Memuat riwayat pesan...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-xs">Belum ada pesan. Mulai sapa calon penyewa!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = m.is_self;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isSelf
                              ? "bg-emerald-600 text-white rounded-br-xs"
                              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-bl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isSelf ? "text-emerald-150" : "text-slate-400"
                            }`}
                          >
                            <span>{formatTime(m.created_at)}</span>
                            {isSelf && (
                              <CheckCheck
                                className={`w-3 h-3 ${m.is_read ? "text-emerald-200" : "text-emerald-300"}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ketik balasan untuk penyewa..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Kirim</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-base text-slate-700 dark:text-slate-200">
                Pilih Percakapan
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Pilih salah satu pesan di sebelah kiri untuk melihat percakapan dan membalas calon penyewa.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
