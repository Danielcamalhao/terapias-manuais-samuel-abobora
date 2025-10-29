import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || "";
  const user = token ? verifyAuth(token) : null;

  const path = request.nextUrl.pathname;

  // Definir rotas protegidas do backoffice
  const backofficePaths = [
    "/dashboard-bo",
    "/servicos-bo",
    "/clientes-bo",
    "/contactos-bo",
  ];

  const isBackofficePage = backofficePaths.some((boPath) => path.startsWith(boPath));

  // Bloquear acesso a páginas do backoffice se não for ADMIN
  if (isBackofficePage && (!user || user.role !== "ADMIN")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Rotas do backoffice
    "/dashboard-bo/:path*",
    "/servicos-bo/:path*",
    "/clientes-bo/:path*",
    "/contactos-bo/:path*",
  ],
};
