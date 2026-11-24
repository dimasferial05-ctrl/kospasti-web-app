import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChatActorFromRequest, maskContactName } from "@/lib/chat-auth";

/**
 * GET /api/chat/rooms/[id]/messages
 * Mengambil seluruh riwayat percakapan di room dan menandai pesan lawan bicara sebagai sudah dibaca
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getChatActorFromRequest(request);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu untuk mengakses pesan." },
        { status: 401 }
      );
    }

    const { id: roomId } = await props.params;

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
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
            is_identity_verified: true,
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

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Ruang obrolan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan requester adalah partisipan dalam ruang obrolan ini
    const isUserParticipant = actor.type === "USER" && room.user_id === actor.id;
    const isOwnerParticipant = actor.type === "OWNER" && room.owner_id === actor.id;

    if (!isUserParticipant && !isOwnerParticipant) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Anda tidak memiliki akses ke ruang obrolan ini." },
        { status: 403 }
      );
    }

    // Ambil semua pesan
    const messages = await prisma.chatMessage.findMany({
      where: { room_id: roomId },
      orderBy: { created_at: "asc" },
    });

    // Tandai pesan lawan bicara yang belum dibaca menjadi dibaca
    const opponentType = actor.type === "USER" ? "OWNER" : "USER";
    const now = new Date();

    await prisma.chatMessage.updateMany({
      where: {
        room_id: roomId,
        sender_type: opponentType,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: now,
      },
    });

    // Reset unread count penonton di ChatRoom
    if (actor.type === "USER" && room.user_unread_count > 0) {
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: { user_unread_count: 0 },
      });
    } else if (actor.type === "OWNER" && room.owner_unread_count > 0) {
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: { owner_unread_count: 0 },
      });
    }

    // Format metadata lawan bicara dengan masking privasi
    const otherPartyName = isUserParticipant
      ? maskContactName(room.owner.name, "OWNER", room.property.name)
      : maskContactName(room.user.name, "USER");

    const otherPartyAvatar = isUserParticipant ? room.owner.avatar_url : room.user.avatar;

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        property_id: room.property_id,
        property_name: room.property.name,
        property_image: room.property.image_url,
        property_price: room.property.price_per_month,
        other_party_name: otherPartyName,
        other_party_avatar: otherPartyAvatar,
        other_party_is_verified: !isUserParticipant ? Boolean(room.user.is_identity_verified) : true,
        current_actor_type: actor.type,
      },
      messages: messages.map((m) => ({
        id: m.id,
        room_id: m.room_id,
        sender_type: m.sender_type,
        sender_id: m.sender_id,
        content: m.content,
        is_read: m.is_read,
        created_at: m.created_at,
        is_self: m.sender_id === actor.id,
      })),
    });
  } catch (error) {
    console.error("Gagal mengambil pesan chat room:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server saat mengambil pesan." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms/[id]/messages
 * Mengirim pesan baru ke ruang obrolan
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getChatActorFromRequest(request);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Silakan login terlebih dahulu untuk mengirim pesan." },
        { status: 401 }
      );
    }

    const { id: roomId } = await props.params;

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        property: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Ruang obrolan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan requester adalah partisipan
    const isUserParticipant = actor.type === "USER" && room.user_id === actor.id;
    const isOwnerParticipant = actor.type === "OWNER" && room.owner_id === actor.id;

    if (!isUserParticipant && !isOwnerParticipant) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Anda tidak berhak mengirim pesan di ruang obrolan ini." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawContent = typeof body?.content === "string" ? body.content.trim() : "";

    if (!rawContent) {
      return NextResponse.json(
        { success: false, error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (rawContent.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Pesan terlalu panjang (maksimum 1000 karakter)." },
        { status: 400 }
      );
    }

    const now = new Date();

    // Buat pesan baru & perbarui metadata room
    const [newMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          room_id: roomId,
          sender_type: actor.type,
          sender_id: actor.id,
          content: rawContent,
          is_read: false,
          created_at: now,
        },
      }),
      prisma.chatRoom.update({
        where: { id: roomId },
        data: {
          last_message_at: now,
          last_message_preview: rawContent.substring(0, 100),
          ...(actor.type === "USER"
            ? { owner_unread_count: { increment: 1 } }
            : { user_unread_count: { increment: 1 } }),
        },
      }),
    ]);

    const formattedMessage = {
      id: newMessage.id,
      room_id: newMessage.room_id,
      sender_type: newMessage.sender_type,
      sender_id: newMessage.sender_id,
      content: newMessage.content,
      is_read: newMessage.is_read,
      created_at: newMessage.created_at,
      is_self: true,
    };

    return NextResponse.json(
      {
        success: true,
        message: formattedMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal mengirim pesan chat:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server saat mengirim pesan." },
      { status: 500 }
    );
  }
}
