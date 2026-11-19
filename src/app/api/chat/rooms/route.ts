import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChatActorFromRequest, maskContactName } from "@/lib/chat-auth";

/**
 * GET /api/chat/rooms
 * Mengambil daftar room chat milik pengguna yang sedang login (Mahasiswa atau Mitra Pemilik Kos)
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await getChatActorFromRequest(request);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu untuk mengakses obrolan." },
        { status: 401 }
      );
    }

    const whereClause =
      actor.type === "USER"
        ? { user_id: actor.id }
        : { owner_id: actor.id };

    const rooms = await prisma.chatRoom.findMany({
      where: whereClause,
      orderBy: {
        last_message_at: "desc",
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            image_url: true,
            address: true,
            price_per_month: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Format data dengan masking privasi
    const formattedRooms = rooms.map((room) => {
      const isOwnerViewer = actor.type === "OWNER";
      const otherPartyName = isOwnerViewer
        ? maskContactName(room.user.name, "USER")
        : maskContactName(room.owner.name, "OWNER", room.property.name);

      const otherPartyAvatar = isOwnerViewer ? room.user.avatar : room.owner.avatar_url;
      const unreadCount = isOwnerViewer ? room.owner_unread_count : room.user_unread_count;

      return {
        id: room.id,
        property_id: room.property_id,
        property_name: room.property.name,
        property_image: room.property.image_url,
        property_price: room.property.price_per_month,
        other_party_name: otherPartyName,
        other_party_avatar: otherPartyAvatar,
        last_message_at: room.last_message_at,
        last_message_preview: room.last_message_preview,
        unread_count: unreadCount,
        created_at: room.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      rooms: formattedRooms,
    });
  } catch (error) {
    console.error("Gagal mengambil daftar chat rooms:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server saat mengambil pesan." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms
 * Membuka atau membuat room obrolan baru antara Mahasiswa dan Pemilik Kos
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await getChatActorFromRequest(request);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu untuk memulai obrolan." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const propertyId = typeof body?.property_id === "string" ? body.property_id.trim() : "";
    const bookingId = typeof body?.booking_id === "string" ? body.booking_id.trim() : null;
    const initialMessage = typeof body?.initial_message === "string" ? body.initial_message.trim() : "";

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "Parameter property_id wajib disertakan." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        owner_id: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Properti kos tidak ditemukan." },
        { status: 404 }
      );
    }

    // 1. Cek apakah pengguna mengklik obrolan di kos miliknya sendiri
    if (actor.type === "OWNER" && property.owner_id === actor.id && !body?.user_id) {
      return NextResponse.json(
        {
          success: false,
          is_own_property: true,
          error: "Ini adalah properti kos yang Anda kelola sendiri. Untuk melihat pesan masuk dari calon penyewa, silakan buka menu Pesan Masuk di Dashboard Mitra.",
          redirect_url: "/partner/dashboard/chats",
        },
        { status: 400 }
      );
    }

    // Tentukan user_id dan owner_id
    let userId = "";
    let ownerId = property.owner_id;

    if (actor.type === "USER") {
      userId = actor.id;
    } else {
      // Jika aktor adalah OWNER:
      const targetUserId = typeof body?.user_id === "string" ? body.user_id.trim() : "";
      if (targetUserId) {
        // Kasus: Pemilik kos yang ingin membalas/memulai chat ke mahasiswa tertentu
        userId = targetUserId;
        ownerId = actor.id;
      } else {
        // Kasus: Pemilik kos sedang menjelajahi kos milik mitra lain dan ingin bertanya sebagai penyewa
        const ownerRecord = await prisma.owner.findUnique({
          where: { id: actor.id },
        });

        if (ownerRecord) {
          // Cari atau buatkan akun User pendamping
          let companionUser = await prisma.user.findFirst({
            where: {
              OR: [
                ownerRecord.email ? { email: ownerRecord.email } : {},
                ownerRecord.whatsapp_number ? { whatsapp: ownerRecord.whatsapp_number } : {},
              ].filter((cond) => Object.keys(cond).length > 0),
            },
          });

          if (!companionUser) {
            companionUser = await prisma.user.create({
              data: {
                name: ownerRecord.name,
                email: ownerRecord.email || `partner_${ownerRecord.id.slice(0, 8)}@kospasti.local`,
                whatsapp: ownerRecord.whatsapp_number,
                avatar: ownerRecord.avatar_url,
              },
            });
          }
          userId = companionUser.id;
          ownerId = property.owner_id;
        } else {
          return NextResponse.json(
            { success: false, error: "Identitas akun tidak valid untuk memulai obrolan." },
            { status: 400 }
          );
        }
      }
    }

    // Cari atau buat ChatRoom
    let room = await prisma.chatRoom.findUnique({
      where: {
        user_id_owner_id_property_id: {
          user_id: userId,
          owner_id: ownerId,
          property_id: propertyId,
        },
      },
    });

    const now = new Date();

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          user_id: userId,
          owner_id: ownerId,
          property_id: propertyId,
          booking_id: bookingId || null,
          last_message_at: now,
          last_message_preview: initialMessage ? initialMessage.substring(0, 100) : "Ruang obrolan dimulai",
          user_unread_count: actor.type === "OWNER" && initialMessage ? 1 : 0,
          owner_unread_count: actor.type === "USER" && initialMessage ? 1 : 0,
        },
      });

      // Jika ada pesan awal, buat ChatMessage pertama
      if (initialMessage) {
        await prisma.chatMessage.create({
          data: {
            room_id: room.id,
            sender_type: actor.type,
            sender_id: actor.id,
            content: initialMessage,
            is_read: false,
          },
        });
      }
    } else if (bookingId && !room.booking_id) {
      // Hubungkan booking_id jika baru ada
      room = await prisma.chatRoom.update({
        where: { id: room.id },
        data: { booking_id: bookingId },
      });
    }

    return NextResponse.json(
      {
        success: true,
        room: {
          id: room.id,
          property_id: room.property_id,
          property_name: property.name,
          user_id: room.user_id,
          owner_id: room.owner_id,
          booking_id: room.booking_id,
          last_message_at: room.last_message_at,
          last_message_preview: room.last_message_preview,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal membuka atau membuat chat room:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server saat membuat ruang obrolan." },
      { status: 500 }
    );
  }
}
