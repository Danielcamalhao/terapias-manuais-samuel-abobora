import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

// Origens permitidas para CORS
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;
  const method = request.method;

  // ============== CORS Headers ==============
  const origin = request.headers.get("origin");
  const response = NextResponse.next();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
  response.headers.set("Access-Control-Allow-Credentials", "true");

  // Preflight requests
  if (method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  // ============== CSRF Protection ==============
  // Verificar Origin/Referer para métodos que modificam estado
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const referer = request.headers.get("referer");
    const originHeader = request.headers.get("origin");

    // Verificar se é uma requisição do mesmo site
    const requestHost = request.headers.get("host") || "";
    const isSameOrigin =
      (referer && new URL(referer).host === requestHost) ||
      (originHeader && new URL(originHeader).host === requestHost);

    // Exceções: APIs públicas de autenticação e webhooks
    const csrfExemptPaths = [
      "/api/login",
      "/api/register",
      "/api/logout",
      "/api/forgot-password",
      "/api/reset-password",
      "/api/verify-email",
      "/api/resend-verification",
      "/api/cron/", // Cron jobs
    ];

    const isExempt = csrfExemptPaths.some((p) => path.startsWith(p));

    if (!isExempt && !isSameOrigin && path.startsWith("/api/")) {
      console.warn("CSRF: Blocked cross-origin request to", path);
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }

  // ============== Rotas do Backoffice ==============
  const backofficePaths = [
    "/dashboard-bo",
    "/servicos-bo",
    "/clientes-bo",
    "/contactos-bo",
    "/marcacoes-bo",
    "/emails-bo",
    "/cms-bo",
  ];

  const isBackofficePage = backofficePaths.some((boPath) => path.startsWith(boPath));

  // ============== API Admin Routes ==============
  const isAdminApi = path.startsWith("/api/admin/");

  // Verificar autenticação para páginas do backoffice e API admin
  if (isBackofficePage || isAdminApi) {
    if (!token) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Verificar se é ADMIN
      if (payload.role !== "ADMIN") {
        if (isAdminApi) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Utilizador autenticado como ADMIN - permitir acesso
      return response;
    } catch (error) {
      console.warn("Middleware: Token verification failed:", error);
      if (isAdminApi) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // ============== Dashboard do Cliente ==============
  if (path.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return response;
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Rotas do backoffice
    "/dashboard-bo/:path*",
    "/servicos-bo/:path*",
    "/clientes-bo/:path*",
    "/contactos-bo/:path*",
    "/marcacoes-bo/:path*",
    "/emails-bo/:path*",
    "/cms-bo/:path*",
    // Dashboard cliente
    "/dashboard/:path*",
    // API routes
    "/api/:path*",
  ],
};
