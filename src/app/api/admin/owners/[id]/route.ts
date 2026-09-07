import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/upload";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    const validToken = process.env.ADMIN_TOKEN || "kospasti_admin_authenticated";
    if (!adminToken || adminToken !== validToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid.",
        },
        { status: 401 }
      );
    }

    const resolvedParams = await context.params;
    const ownerId = resolvedParams.id;

    if (!ownerId || typeof ownerId !== "string" || ownerId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Bad Request: ID pemilik tidak valid." },
        { status: 400 }
      );
    }

    const trimmedId = ownerId.trim();

    // Periksa apakah owner ada di database
    const existingOwner = await prisma.owner.findUnique({
      where: { id: trimmedId },
    });

    if (!existingOwner) {
      return NextResponse.json(
        { success: false, error: "Pemilik kos tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, whatsapp_number } = body || {};

    const updateData: { name?: string; whatsapp_number?: string } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json(
          { success: false, error: "Nama pemilik tidak boleh kosong." },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (whatsapp_number !== undefined) {
      if (typeof whatsapp_number !== "string" || whatsapp_number.trim() === "") {
        return NextResponse.json(
          { success: false, error: "Nomor WhatsApp tidak boleh kosong." },
          { status: 400 }
        );
      }
      const trimmedWhatsapp = whatsapp_number.trim();

      // Cek duplikasi nomor WhatsApp pada pemilik lain
      if (trimmedWhatsapp !== existingOwner.whatsapp_number) {
        const duplicateOwner = await prisma.owner.findFirst({
          where: {
            whatsapp_number: trimmedWhatsapp,
            NOT: {
              id: trimmedId,
            },
          },
        });

        if (duplicateOwner) {
          return NextResponse.json(
            { success: false, error: "Nomor WhatsApp sudah digunakan oleh pemilik lain." },
            { status: 409 }
          );
        }
      }

      updateData.whatsapp_number = trimmedWhatsapp;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada data yang diubah." },
        { status: 400 }
      );
    }

    const updatedOwner = await prisma.owner.update({
      where: { id: trimmedId },
      data: updateData,
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
        properties: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOwner,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal memperbarui pemilik kos:", error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    const validToken = process.env.ADMIN_TOKEN || "kospasti_admin_authenticated";
    if (!adminToken || adminToken !== validToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid.",
        },
        { status: 401 }
      );
    }

    const resolvedParams = await context.params;
    const ownerId = resolvedParams.id;

    if (!ownerId || typeof ownerId !== "string" || ownerId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Bad Request: ID pemilik tidak valid." },
        { status: 400 }
      );
    }

    const trimmedId = ownerId.trim();

    // Cari pemilik beserta seluruh properti dan media terkait
    const owner = await prisma.owner.findUnique({
      where: { id: trimmedId },
      include: {
        properties: {
          include: {
            media: true,
          },
        },
      },
    });

    if (!owner) {
      return NextResponse.json(
        { success: false, error: "Pemilik kos tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hapus seluruh file fisik media milik semua properti pemilik ini
    const deletedUrls = new Set<string>();
    for (const property of owner.properties) {
      for (const media of property.media) {
        if (media.url && !deletedUrls.has(media.url)) {
          await deleteUploadedFile(media.url);
          deletedUrls.add(media.url);
        }
      }
      if (property.image_url && !deletedUrls.has(property.image_url)) {
        await deleteUploadedFile(property.image_url);
        deletedUrls.add(property.image_url);
      }
    }

    // Hapus pemilik dari database (cascade delete otomatis menghapus properties, magic links, bookings, media di DB)
    await prisma.owner.delete({
      where: { id: trimmedId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal menghapus pemilik kos:", error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
