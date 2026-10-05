import { NextResponse } from "next/server";

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

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&addressdetails=1&accept-language=id`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "KosPasti-App/1.0 (adminkospasti@gmail.com)",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Gagal memproses geocoding." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const displayName = data?.display_name || "";

    return NextResponse.json({
      success: true,
      address: displayName,
      details: data?.address || null,
    });
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat geocoding." },
      { status: 500 }
    );
  }
}
