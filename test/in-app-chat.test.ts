import { describe, it, expect, vi, beforeEach } from "vitest";
import { maskContactName } from "@/lib/chat-auth";
import { GET as getRooms, POST as createRoom } from "@/app/api/chat/rooms/route";
import {
  GET as getMessages,
  POST as sendMessage,
} from "@/app/api/chat/rooms/[id]/messages/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as chatAuth from "@/lib/chat-auth";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation(async (arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg();
    }),
    property: {
      findUnique: vi.fn(),
    },
    chatRoom: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    chatMessage: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("In-App Chat - Privacy Masking Helper", () => {
  it("masks student full name to initial and label", () => {
    expect(maskContactName("Budi Santoso", "USER")).toBe("Budi S. (Penyewa)");
    expect(maskContactName("Annisa Tri Wahyuni", "USER")).toBe("Annisa T. (Penyewa)");
    expect(maskContactName("Rian", "USER")).toBe("Rian (Penyewa)");
  });

  it("masks owner name with property context", () => {
    expect(maskContactName("Haji Ahmad", "OWNER", "Kos Melati")).toBe("Pengelola Kos Melati");
    expect(maskContactName("Ibu Siti", "OWNER")).toBe("Pengelola Kos (Ibu Siti)");
  });
});

describe("In-App Chat API - /api/chat/rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/chat/rooms returns 401 if unauthenticated", async () => {
    vi.spyOn(chatAuth, "getChatActorFromRequest").mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/chat/rooms");
    const res = await getRooms(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/chat/rooms returns masked room list for authenticated student", async () => {
    vi.spyOn(chatAuth, "getChatActorFromRequest").mockResolvedValue({
      type: "USER",
      id: "user-123",
      name: "Budi Santoso",
    });

    (prisma.chatRoom.findMany as any).mockResolvedValue([
      {
        id: "room-abc",
        property_id: "prop-1",
        user_id: "user-123",
        owner_id: "owner-99",
        last_message_at: new Date(),
        last_message_preview: "Halo apakah kamar masih ada?",
        user_unread_count: 0,
        owner_unread_count: 1,
        created_at: new Date(),
        property: {
          id: "prop-1",
          name: "Kos Melati Indah",
          image_url: null,
          address: "Subang",
          price_per_month: 750000,
        },
        user: { id: "user-123", name: "Budi Santoso", avatar: null },
        owner: { id: "owner-99", name: "Ibu Siti", avatar_url: null },
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/chat/rooms");
    const res = await getRooms(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.rooms).toHaveLength(1);
    expect(json.rooms[0].other_party_name).toBe("Pengelola Kos Melati Indah");
  });

  it("POST /api/chat/rooms rejects missing property_id", async () => {
    vi.spyOn(chatAuth, "getChatActorFromRequest").mockResolvedValue({
      type: "USER",
      id: "user-123",
      name: "Budi Santoso",
    });

    const req = new NextRequest("http://localhost:3000/api/chat/rooms", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await createRoom(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/chat/rooms creates a new room if not found", async () => {
    vi.spyOn(chatAuth, "getChatActorFromRequest").mockResolvedValue({
      type: "USER",
      id: "user-123",
      name: "Budi Santoso",
    });

    (prisma.property.findUnique as any).mockResolvedValue({
      id: "prop-1",
      name: "Kos Nyaman",
      owner_id: "owner-99",
    });

    (prisma.chatRoom.findUnique as any).mockResolvedValue(null);

    const newRoomMock = {
      id: "new-room-1",
      user_id: "user-123",
      owner_id: "owner-99",
      property_id: "prop-1",
      last_message_at: new Date(),
      last_message_preview: "Tanya kos",
    };
    (prisma.chatRoom.create as any).mockResolvedValue(newRoomMock);

    const req = new NextRequest("http://localhost:3000/api/chat/rooms", {
      method: "POST",
      body: JSON.stringify({ property_id: "prop-1", initial_message: "Tanya kos" }),
    });

    const res = await createRoom(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.room.id).toBe("new-room-1");
    expect(prisma.chatRoom.create).toHaveBeenCalled();
  });
});

describe("In-App Chat API - /api/chat/rooms/[id]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 403 if requester is not a participant", async () => {
    vi.spyOn(chatAuth, "getChatActorFromRequest").mockResolvedValue({
      type: "USER",
      id: "intruder-user",
      name: "Intruder",
    });

    (prisma.chatRoom.findUnique as any).mockResolvedValue({
      id: "room-1",
      user_id: "legit-user",
      owner_id: "legit-owner",
      property: { name: "Kos Aman" },
      user: { name: "Legit" },
      owner: { name: "Owner" },
    });

    const req = new NextRequest("http://localhost:3000/api/chat/rooms/room-1/messages");
    const res = await getMessages(req, { params: Promise.resolve({ id: "room-1" }) });
    expect(res.status).toBe(403);
  });

  it("GET marks opponent unread messages as read for legitimate participant", async () => {
    vi.spyOn(chatAuth, "getChatActorFromRequest").mockResolvedValue({
      type: "USER",
      id: "user-123",
      name: "Budi Santoso",
    });

    (prisma.chatRoom.findUnique as any).mockResolvedValue({
      id: "room-1",
      user_id: "user-123",
      owner_id: "owner-99",
      user_unread_count: 2,
      property: { name: "Kos Melati", price_per_month: 800000 },
      user: { name: "Budi" },
      owner: { name: "Ibu Siti" },
    });

    (prisma.chatMessage.findMany as any).mockResolvedValue([
      {
        id: "msg-1",
        room_id: "room-1",
        sender_type: "OWNER",
        sender_id: "owner-99",
        content: "Halo, kamar masih sisa 1 ya.",
        is_read: false,
        created_at: new Date(),
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/chat/rooms/room-1/messages");
    const res = await getMessages(req, { params: Promise.resolve({ id: "room-1" }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.messages).toHaveLength(1);
    expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ room_id: "room-1", sender_type: "OWNER", is_read: false }),
      })
    );
  });

  it("POST rejects empty message or overly long message (>1000 chars)", async () => {
    vi.spyOn(chatAuth, "getChatActorFromRequest").mockResolvedValue({
      type: "USER",
      id: "user-123",
      name: "Budi Santoso",
    });

    (prisma.chatRoom.findUnique as any).mockResolvedValue({
      id: "room-1",
      user_id: "user-123",
      owner_id: "owner-99",
    });

    // Empty message
    const emptyReq = new NextRequest("http://localhost:3000/api/chat/rooms/room-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "   " }),
    });
    const emptyRes = await sendMessage(emptyReq, { params: Promise.resolve({ id: "room-1" }) });
    expect(emptyRes.status).toBe(400);

    // Overly long message
    const longContent = "a".repeat(1005);
    const longReq = new NextRequest("http://localhost:3000/api/chat/rooms/room-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: longContent }),
    });
    const longRes = await sendMessage(longReq, { params: Promise.resolve({ id: "room-1" }) });
    expect(longRes.status).toBe(400);
  });

  it("POST successfully saves message and increments owner unread count", async () => {
    vi.spyOn(chatAuth, "getChatActorFromRequest").mockResolvedValue({
      type: "USER",
      id: "user-123",
      name: "Budi Santoso",
    });

    (prisma.chatRoom.findUnique as any).mockResolvedValue({
      id: "room-1",
      user_id: "user-123",
      owner_id: "owner-99",
    });

    const createdMsg = {
      id: "msg-new-1",
      room_id: "room-1",
      sender_type: "USER",
      sender_id: "user-123",
      content: "Halo apa bisa survei besok sore?",
      is_read: false,
      created_at: new Date(),
    };
    (prisma.chatMessage.create as any).mockResolvedValue(createdMsg);
    (prisma.chatRoom.update as any).mockResolvedValue({});

    const req = new NextRequest("http://localhost:3000/api/chat/rooms/room-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Halo apa bisa survei besok sore?" }),
    });

    const res = await sendMessage(req, { params: Promise.resolve({ id: "room-1" }) });
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message.content).toBe("Halo apa bisa survei besok sore?");
    expect(prisma.chatRoom.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          owner_unread_count: { increment: 1 },
        }),
      })
    );
  });
});
