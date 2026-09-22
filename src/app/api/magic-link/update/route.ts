import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Format request body tidak valid (harus berupa JSON)",
        },
        { status: 400 }
      );
    }

    const { token, propertyId, availableRooms, updates } = body;

    // Validasi tipe data & ketersediaan field wajib
    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Token wajib diisi",
        },
        { status: 400 }
      );
    }

    if (!propertyId || typeof propertyId !== "string" || !propertyId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ID properti wajib diisi",
        },
        { status: 400 }
      );
    }

    const hasUpdatesArray = Array.isArray(updates) && updates.length > 0;

    if (hasUpdatesArray) {
      for (const item of updates) {
        if (!item.roomTypeId || typeof item.roomTypeId !== "string" || !item.roomTypeId.trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "ID tipe kamar tidak valid",
            },
            { status: 400 }
          );
        }
        if (
          typeof item.availableRooms !== "number" ||
          isNaN(item.availableRooms) ||
          item.availableRooms < 0 ||
          !Number.isInteger(item.availableRooms)
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Jumlah kamar tidak valid (harus berupa bilangan bulat >= 0)",
            },
            { status: 400 }
          );
        }
      }
    } else {
      if (
        typeof availableRooms !== "number" ||
        isNaN(availableRooms) ||
        availableRooms < 0 ||
        !Number.isInteger(availableRooms)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Jumlah kamar tidak valid (harus berupa bilangan bulat >= 0)",
          },
          { status: 400 }
        );
      }
    }

    const trimmedToken = token.trim();
    const trimmedPropertyId = propertyId.trim();

    // Cari Magic Link di database
    const magicLink = await prisma.magicLink.findUnique({
      where: { token: trimmedToken },
      include: {
        owner: {
          select: {
            id: true,
            properties: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!magicLink) {
      return NextResponse.json(
        {
          success: false,
          error: "Token tidak ditemukan",
        },
        { status: 404 }
      );
    }

    if (magicLink.is_used) {
      return NextResponse.json(
        {
          success: false,
          error: "Token sudah pernah digunakan",
        },
        { status: 401 }
      );
    }

    if (new Date() > magicLink.expires_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Token sudah kedaluwarsa",
        },
        { status: 401 }
      );
    }

    // Pastikan properti milik owner dari token tersebut
    const isPropertyOwned = magicLink.owner.properties.some(
      (property) => property.id === trimmedPropertyId
    );

    if (!isPropertyOwned) {
      return NextResponse.json(
        {
          success: false,
          error: "Properti tidak ditemukan untuk pemilik token ini",
        },
        { status: 404 }
      );
    }

    // Pembaruan data menggunakan transaksi atomik dengan Optimistic Concurrency Control
    try {
      await prisma.$transaction(
        async (tx) => {
          const magicLinkResult = await tx.magicLink.updateMany({
            where: {
              token: trimmedToken,
              is_used: false,
            },
            data: {
              is_used: true,
            },
          });

          if (magicLinkResult.count === 0) {
            throw new Error("TOKEN_ALREADY_USED");
          }

          if (hasUpdatesArray) {
            // Validasi relasi room types terhadap property
            const existingRoomTypes = await tx.roomType.findMany({
              where: { property_id: trimmedPropertyId },
              select: { id: true },
            });
            const existingIds = new Set(existingRoomTypes.map((rt) => rt.id));

            for (const item of updates) {
              const trimmedRoomTypeId = item.roomTypeId.trim();
              if (!existingIds.has(trimmedRoomTypeId)) {
                throw new Error("ROOM_TYPE_NOT_FOUND");
              }

              await tx.roomType.update({
                where: { id: trimmedRoomTypeId },
                data: {
                  available_rooms: item.availableRooms,
                  updated_at: new Date(),
                },
              });
            }

            // Hitung total akumulasi kamar dari seluruh room_types di properti ini
            const allRoomTypes = await tx.roomType.findMany({
              where: { property_id: trimmedPropertyId },
              select: { available_rooms: true },
            });

            const totalAvailableRooms = allRoomTypes.reduce(
              (sum, rt) => sum + rt.available_rooms,
              0
            );

            await tx.property.update({
              where: { id: trimmedPropertyId },
              data: {
                available_rooms: totalAvailableRooms,
                updated_at: new Date(),
              },
            });
          } else {
            await tx.property.update({
              where: { id: trimmedPropertyId },
              data: {
                available_rooms: availableRooms,
                updated_at: new Date(),
              },
            });
          }
        },
        {
          maxWait: 15000,
          timeout: 20000,
        }
      );
    } catch (txError: unknown) {
      if (txError instanceof Error) {
        if (txError.message === "TOKEN_ALREADY_USED") {
          return NextResponse.json(
            {
              success: false,
              error: "Token sudah pernah digunakan",
            },
            { status: 401 }
          );
        }
        if (txError.message === "ROOM_TYPE_NOT_FOUND") {
          return NextResponse.json(
            {
              success: false,
              error: "Tipe kamar tidak ditemukan pada properti ini",
            },
            { status: 404 }
          );
        }
      }
      throw txError;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data kamar berhasil diperbarui.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating room via magic link:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server",
      },
      { status: 500 }
    );
  }
}
