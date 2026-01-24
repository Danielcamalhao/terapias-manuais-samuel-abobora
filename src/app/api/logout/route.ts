import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { logLogout } from "@/lib/audit-log";
import { revokeAccessToken, revokeAllUserTokens } from "@/lib/tokens";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
      try {
        // Decodificar token para obter informações
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as {
          id: string;
          jti?: string;
        };

        // Revogar o access token atual
        if (decoded.jti) {
          await revokeAccessToken(token, "logout");
        }

        // Verificar se é logout de todos os dispositivos
        const body = await req.json().catch(() => ({}));
        if (body.logoutAll) {
          await revokeAllUserTokens(decoded.id, "logout_all");
        }

        // Registar logout no audit log
        await logLogout(decoded.id);
      } catch (e) {
        // Token inválido ou expirado, mas continuar com o logout
        console.warn("Logout: Token inválido ou expirado", e);
      }
    }

    const response = NextResponse.json({ success: true });

    // Limpar cookie
    response.cookies.set("token", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Limpar refresh token se existir
    response.cookies.set("refreshToken", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return response;
  } catch (err) {
    console.error("Erro no logout:", err);
    // Mesmo com erro, limpar cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", "", { maxAge: 0, path: "/" });
    return response;
  }
}
