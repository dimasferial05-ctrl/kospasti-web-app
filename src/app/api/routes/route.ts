import { NextResponse } from "next/server";

// Format durasi tempuh yang akurat dan realistis
function formatRouteDuration(meters: number, rawSeconds: number, isWalking: boolean): string {
  let seconds = rawSeconds;

  if (isWalking) {
    // Jalan kaki: kecepatan rata-rata ~4.5 km/jam (~13.3 menit per km)
    const minWalkingSeconds = Math.round((meters / 4500) * 3600);
    if (!seconds || seconds < minWalkingSeconds * 0.7) {
      seconds = minWalkingSeconds;
    }
  } else {
    // Berkendara: kecepatan rata-rata perkotaan ~28 km/jam (~2.1 menit per km)
    const expectedDrivingSeconds = Math.round((meters / 28000) * 3600);
    if (!seconds || seconds > expectedDrivingSeconds * 3) {
      seconds = expectedDrivingSeconds;
    }
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return remMins > 0 ? `${hours} jam ${remMins} menit` : `${hours} jam`;
  }
  return `${minutes} menit`;
}

// Fallback high-accuracy real-road network routing via OSRM (Open Source Routing Machine)
async function fetchOSRMRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: "DRIVING" | "WALKING"
) {
  try {
    const isWalking = mode === "WALKING";
    const profile = isWalking ? "foot" : "driving";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    const res = await fetch(url, {
      headers: { "User-Agent": "KosPastiWebApp/1.0" },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route || !route.geometry?.coordinates || route.geometry.coordinates.length === 0) {
      return null;
    }

    const meters = route.distance ?? 0;
    const distanceStr =
      meters >= 1000
        ? `${(meters / 1000).toFixed(1)} km`
        : `${Math.round(meters)} m`;

    const durationStr = formatRouteDuration(meters, route.duration ?? 0, isWalking);

    const coordinates: { lat: number; lng: number }[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
    );

    return {
      distance: distanceStr,
      duration: durationStr,
      coordinates,
      isActualRoad: true,
    };
  } catch (err) {
    console.warn("OSRM routing request failed:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin, destination, travelMode = "DRIVING" } = body;

    if (
      !origin ||
      typeof origin.lat !== "number" ||
      typeof origin.lng !== "number" ||
      !destination ||
      typeof destination.lat !== "number" ||
      typeof destination.lng !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Origin dan destination harus memiliki koordinat lat dan lng yang valid",
        },
        { status: 400 }
      );
    }

    const isWalking = travelMode === "WALKING";
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY;

    // 1. Coba menggunakan Google Routes API v2
    if (apiKey) {
      const payload: Record<string, unknown> = {
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
        travelMode: isWalking ? "WALK" : "DRIVE",
        computeAlternativeRoutes: false,
        languageCode: "id-ID",
        units: "METRIC",
      };

      if (!isWalking) {
        payload.routingPreference = "TRAFFIC_UNAWARE";
      }

      try {
        const gRes = await fetch(
          "https://routes.googleapis.com/directions/v2:computeRoutes",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
            },
            body: JSON.stringify(payload),
          }
        );

        if (gRes.ok) {
          const gData = await gRes.json();
          const route = gData.routes?.[0];
          if (route) {
            const meters = route.distanceMeters ?? 0;
            const distanceStr =
              meters >= 1000
                ? `${(meters / 1000).toFixed(1)} km`
                : `${meters} m`;

            const rawSeconds = route.duration
              ? parseInt(route.duration.replace("s", ""), 10)
              : 0;

            const durationStr = formatRouteDuration(meters, rawSeconds, isWalking);

            return NextResponse.json({
              success: true,
              data: {
                distance: distanceStr,
                duration: durationStr,
                encodedPolyline: route.polyline?.encodedPolyline || null,
                coordinates: null,
                isActualRoad: true,
              },
            });
          }
        }
      } catch (apiErr) {
        console.warn("Google Routes API failed, switching to OSRM engine:", apiErr);
      }
    }

    // 2. Mesin Rute Jalan Raya Nyata (OSRM) - Mengikuti jaringan jalan & jalur pejalan kaki
    const osrmResult = await fetchOSRMRoute(origin, destination, travelMode);
    if (osrmResult) {
      return NextResponse.json({
        success: true,
        data: {
          distance: osrmResult.distance,
          duration: osrmResult.duration,
          encodedPolyline: null,
          coordinates: osrmResult.coordinates,
          isActualRoad: true,
        },
      });
    }

    // 3. Fallback jika seluruh layanan routing offline (Formula Haversine)
    const R = 6371; // km
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
    const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMeters = Math.round(R * c * 1000);
    const distKm = Math.round(R * c * 10) / 10;

    const speedKmH = isWalking ? 4.5 : 28;
    const durationStr = formatRouteDuration(
      distMeters,
      Math.round((distKm / speedKmH) * 3600),
      isWalking
    );

    return NextResponse.json({
      success: true,
      data: {
        distance: `${distKm} km`,
        duration: durationStr,
        encodedPolyline: null,
        coordinates: [origin, destination],
        isActualRoad: false,
      },
    });
  } catch (error) {
    console.error("Error computing routes:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghitung rute lokasi" },
      { status: 500 }
    );
  }
}
