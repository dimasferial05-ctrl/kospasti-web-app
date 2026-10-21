import { NextResponse } from "next/server";
import { reverseGeocodeCoordinate } from "@/lib/geocoding";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: "Latitude dan Longitude wajib disediakan." },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json(
        { success: false, error: "Koordinat tidak valid." },
        { status: 400 }
      );
    }

    const result = await reverseGeocodeCoordinate(latNum, lngNum);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Gagal memproses geocoding." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      address: result.address,
      details: result.details,
      source: result.source,
    });
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat geocoding." },
      { status: 500 }
    );
  }
}
