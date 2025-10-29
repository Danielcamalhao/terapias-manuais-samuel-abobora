import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

/**
 * Verifica e decodifica o token JWT vindo do cookie
 * Retorna null se o token for inválido, expirado ou ausente.
 */
export function verifyAuth(token?: string) {
  try {
    // 🔹 Se não existir token → devolve null (evita crash)
    if (!token) return null;

    // 🔹 Verifica e decodifica o JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔹 Garante que tem o formato esperado
    if (!decoded || typeof decoded !== "object") return null;

    return decoded as { id: string; email: string; role: string };
  } catch (error) {
    console.warn("⚠️ Token inválido ou expirado:", error);
    return null;
  }
}
