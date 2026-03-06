import { NextResponse } from "next/server";

export function middleware(request) {
  console.log("Middleware eseguito su:", request.nextUrl.pathname);
  
  const token = request.cookies.get("__session")?.value;
  console.log("Token presente:", !!token);

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};