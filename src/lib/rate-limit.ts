import { prisma } from "./prisma";

interface RateLimitConfig {
  maxAttempts: number;      // Máximo de tentativas
  windowMs: number;         // Janela de tempo em ms
  blockDurationMs: number;  // Duração do bloqueio em ms
}

const defaultConfig: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,      // 15 minutos
  blockDurationMs: 30 * 60 * 1000, // 30 minutos de bloqueio
};

// Configurações por endpoint
const endpointConfigs: Record<string, RateLimitConfig> = {
  "/api/login": {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000,
  },
  "/api/register": {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,      // 1 hora
    blockDurationMs: 60 * 60 * 1000,
  },
  "/api/forgot-password": {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
  },
  "/api/resend-verification": {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
  },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  blockedUntil?: Date;
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string
): Promise<RateLimitResult> {
  const config = endpointConfigs[endpoint] || defaultConfig;
  const now = new Date();

  try {
    // Buscar ou criar registo de tentativas
    let attempt = await prisma.rateLimitAttempt.findUnique({
      where: {
        identifier_endpoint: { identifier, endpoint },
      },
    });

    // Se está bloqueado, verificar se o bloqueio expirou
    if (attempt?.blockedUntil) {
      if (attempt.blockedUntil > now) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: attempt.blockedUntil,
          blockedUntil: attempt.blockedUntil,
        };
      }
      // Bloqueio expirou, resetar
      await prisma.rateLimitAttempt.delete({
        where: { id: attempt.id },
      });
      attempt = null;
    }

    // Se não existe ou a janela expirou, criar novo
    if (!attempt) {
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    // Verificar se a janela expirou
    const windowExpiry = new Date(attempt.firstAttempt.getTime() + config.windowMs);
    if (windowExpiry < now) {
      // Janela expirou, resetar
      await prisma.rateLimitAttempt.delete({
        where: { id: attempt.id },
      });
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    // Verificar se excedeu o limite
    if (attempt.attempts >= config.maxAttempts) {
      // Bloquear
      const blockedUntil = new Date(now.getTime() + config.blockDurationMs);
      await prisma.rateLimitAttempt.update({
        where: { id: attempt.id },
        data: { blockedUntil },
      });
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockedUntil,
        blockedUntil,
      };
    }

    // Ainda tem tentativas
    return {
      allowed: true,
      remaining: config.maxAttempts - attempt.attempts - 1,
      resetAt: windowExpiry,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Em caso de erro, permitir (fail open) - pode ser mudado para fail closed
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }
}

export async function recordAttempt(
  identifier: string,
  endpoint: string,
  success: boolean
): Promise<void> {
  const now = new Date();
  const config = endpointConfigs[endpoint] || defaultConfig;

  try {
    if (success) {
      // Login bem-sucedido, limpar tentativas
      await prisma.rateLimitAttempt.deleteMany({
        where: { identifier, endpoint },
      });
      return;
    }

    // Incrementar tentativas
    await prisma.rateLimitAttempt.upsert({
      where: {
        identifier_endpoint: { identifier, endpoint },
      },
      create: {
        identifier,
        endpoint,
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
      },
      update: {
        attempts: { increment: 1 },
        lastAttempt: now,
      },
    });
  } catch (error) {
    console.error("Rate limit record error:", error);
  }
}

// Limpar registos expirados (chamar periodicamente)
export async function cleanupExpiredRateLimits(): Promise<number> {
  const now = new Date();
  const result = await prisma.rateLimitAttempt.deleteMany({
    where: {
      OR: [
        { blockedUntil: { lt: now } },
        {
          firstAttempt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          blockedUntil: null,
        },
      ],
    },
  });
  return result.count;
}
