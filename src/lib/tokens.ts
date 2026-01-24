import { prisma } from "./prisma";
import jwt from "jsonwebtoken";
import { generateSecureToken, generateJwtId } from "./encryption";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutos
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  jti?: string;
}

/**
 * Gera um par de tokens (access + refresh)
 */
export async function generateTokenPair(user: {
  id: string;
  email: string;
  role: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}> {
  const jti = generateJwtId();
  const now = new Date();

  // Access token (curta duração)
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      jti,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Refresh token (longa duração)
  const refreshToken = generateSecureToken(48);
  const refreshTokenExpiry = new Date(now.getTime() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Guardar refresh token na BD
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    },
  });

  // Access token expira em 15 minutos
  const accessTokenExpiry = new Date(now.getTime() + 15 * 60 * 1000);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry,
    refreshTokenExpiry,
  };
}

/**
 * Verifica e renova tokens usando refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
} | null> {
  const now = new Date();

  // Buscar refresh token
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    return null;
  }

  // Verificar se expirou ou foi revogado
  if (storedToken.expiresAt < now || storedToken.revokedAt) {
    return null;
  }

  // Buscar utilizador
  const user = await prisma.user.findUnique({
    where: { id: storedToken.userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return null;
  }

  // Rotação de refresh token - revogar o antigo e criar novo
  const newTokens = await generateTokenPair(user);

  // Revogar o token antigo e marcar como substituído
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: {
      revokedAt: now,
      replacedBy: newTokens.refreshToken,
    },
  });

  return newTokens;
}

/**
 * Revoga um access token (adiciona à blacklist)
 */
export async function revokeAccessToken(
  token: string,
  reason?: string
): Promise<boolean> {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    if (!decoded?.jti) return false;

    // Obter data de expiração do token
    const payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as TokenPayload & { exp: number };
    const expiresAt = new Date(payload.exp * 1000);

    // Adicionar à blacklist
    await prisma.revokedToken.create({
      data: {
        jti: decoded.jti,
        expiresAt,
        reason,
      },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Revoga todos os refresh tokens de um utilizador
 */
export async function revokeAllUserTokens(userId: string, reason?: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Verifica se um token foi revogado
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const revoked = await prisma.revokedToken.findUnique({
    where: { jti },
  });
  return !!revoked;
}

/**
 * Verifica um access token (incluindo verificação de revogação)
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Verificar se foi revogado
    if (decoded.jti) {
      const revoked = await isTokenRevoked(decoded.jti);
      if (revoked) return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Limpa tokens expirados da BD
 */
export async function cleanupExpiredTokens(): Promise<{
  refreshTokens: number;
  revokedTokens: number;
}> {
  const now = new Date();

  // Limpar refresh tokens expirados ou revogados há mais de 1 dia
  const refreshResult = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        {
          revokedAt: {
            lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });

  // Limpar tokens revogados que já expiraram
  const revokedResult = await prisma.revokedToken.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });

  return {
    refreshTokens: refreshResult.count,
    revokedTokens: revokedResult.count,
  };
}
