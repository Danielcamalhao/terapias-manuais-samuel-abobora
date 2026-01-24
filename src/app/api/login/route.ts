import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { logLogin } from "@/lib/audit-log";
import { generateJwtId } from "@/lib/encryption";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FALTA definir JWT_SECRET no ficheiro .env");
  throw new Error("JWT_SECRET não definido no ambiente");
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    const body = await req.json();
    const { email, password } = body;

    // ============== Rate Limiting ==============
    const rateLimitResult = await checkRateLimit(ip, "/api/login");

    if (!rateLimitResult.allowed) {
      const minutesLeft = Math.ceil(
        (rateLimitResult.blockedUntil!.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          error: `Demasiadas tentativas. Tente novamente em ${minutesLeft} minutos.`,
          blockedUntil: rateLimitResult.blockedUntil,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(minutesLeft * 60),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    // ============== Validação de Email ==============
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Registar tentativa falhada (mas não revelar se o email existe)
      await recordAttempt(ip, "/api/login", false);
      await logLogin("unknown", false, { email, reason: "user_not_found" });

      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // ============== Validação de Password ==============
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await recordAttempt(ip, "/api/login", false);
      await logLogin(user.id, false, { reason: "invalid_password" });

      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // ============== Login Bem-Sucedido ==============
    await recordAttempt(ip, "/api/login", true); // Limpa tentativas

    // Gerar JWT com ID único (para revogação)
    const jti = generateJwtId();
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        jti,
      },
      JWT_SECRET!,
      { expiresIn: "1d" }
    );

    // Audit log
    await logLogin(user.id, true, { ip });

    const response = NextResponse.json({
      success: true,
      role: user.role,
      emailVerified: user.emailVerified,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 dia
    });

    // Headers de segurança
    response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
    response.headers.set("X-RateLimit-Reset", rateLimitResult.resetAt.toISOString());

    return response;
  } catch (err) {
    console.error("Erro no login:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
