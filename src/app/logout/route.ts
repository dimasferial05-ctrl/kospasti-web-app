import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.set({
    name: "user_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
  });

  return response;
}
