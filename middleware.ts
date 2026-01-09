import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;

  // Definir rotas protegidas do backoffice
  const backofficePaths = [
    "/dashboard-bo",
    "/servicos-bo",
    "/clientes-bo",
    "/contactos-bo",
    "/marcacoes-bo",
    "/emails-bo",
  ];

  const isBackofficePage = backofficePaths.some((boPath) => path.startsWith(boPath));

  // Só verificar autenticação para páginas do backoffice
  if (!isBackofficePage) {
    return NextResponse.next();
  }

  // Verificar se há token
  if (!token) {
    console.log("Middleware: No token found, redirecting to login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    // Verificar JWT usando jose (compatível com Edge Runtime)
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Verificar se é ADMIN
    if (payload.role !== "ADMIN") {
      console.log("Middleware: User is not ADMIN, redirecting to dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Utilizador autenticado como ADMIN - permitir acesso
    return NextResponse.next();
  } catch (error) {
    console.log("Middleware: Token verification failed:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
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
