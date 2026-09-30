import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Logout mitra berhasil.",
    },
    { status: 200 }
  );

  response.cookies.delete("partner_token");
  return response;
}
