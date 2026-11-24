"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Loader2,
  Building,
  ShieldCheck,
  CheckCheck,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { subscribeToChatRoom, broadcastChatMessage } from "@/lib/supabase-client";

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

interface RoomInfo {
  id: string;
  property_id: string;
  property_name: string;
  property_image: string | null;
  property_price: number;
  other_party_name: string;
  other_party_avatar: string | null;
  other_party_is_verified?: boolean;
  current_actor_type: string;
}

export default function StudentChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    window.visualViewport.addEventListener("resize", updateViewportHeight);
    window.visualViewport.addEventListener("scroll", updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
    };
  }, []);

  const fetchMessages = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      const data = await res.json();

      if (res.ok && data.success) {
        setRoom(data.room);
        setMessages(data.messages || []);
      } else {
        if (!silent) {
          if (res.status === 401) {
            router.push(`/login?callbackUrl=/chat/${roomId}`);
          } else {
            setErrorMsg(data.error || "Gagal memuat obrolan.");
          }
        }
      }
    } catch {
      if (!silent) setErrorMsg("Terjadi gangguan koneksi ke server chat.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    fetchMessages();

    // Supabase Realtime Listener
    const unsubscribe = subscribeToChatRoom(roomId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, { ...newMsg, is_self: newMsg.sender_type === "USER" }];
      });
    });

    // Fallback polling interval
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setInputText("");
        setMessages((prev) => [...prev, data.message]);
        await broadcastChatMessage(roomId, data.message);
      } else {
        alert(data.error || "Gagal mengirim pesan.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi saat mengirim pesan.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-xs font-semibold text-slate-500">Menghubungkan ke ruang obrolan...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Tidak Dapat Membuka Obrolan</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{errorMsg}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      <div
        style={{
          height:
            viewportHeight && viewportHeight < 600
              ? `${viewportHeight - 24}px`
              : undefined,
        }}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-float overflow-hidden flex flex-col h-[calc(100dvh-5rem)] sm:h-[82vh]"
      >
        {/* Top Header */}
        <div className="p-3.5 sm:px-5 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <Building className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  {room?.other_party_name || "Pengelola Kos"}
                </h2>
                {room?.other_party_is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Terverifikasi</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {room?.property_name} {room?.property_price ? `• ${formatRupiah(room.property_price)}/bln` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {room?.property_id && (
              <Link
                href={`/kos/${room.property_id}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                <span>Lihat Kos</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Privasi Aman</span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Privacy Notice Pill */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-800/40 text-center text-xs text-indigo-700 dark:text-indigo-300 space-y-0.5 max-w-md mx-auto">
            <p className="font-bold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Chat Resmi KosPasti</span>
            </p>
            <p className="text-[11px]">
              Nomor WhatsApp Anda disamarkan. Jangan melakukan transfer di luar rekening resmi Escrow KosPasti.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">Mulai percakapan dengan pengelola kos.</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Tanyakan ketersediaan kamar, fasilitas, atau aturan kos sebelum melakukan booking.
              </p>
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
                    className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
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

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 250);
            }}
            placeholder="Tulis pesan untuk pengelola kos..."
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
      </div>
    </div>
  );
}
