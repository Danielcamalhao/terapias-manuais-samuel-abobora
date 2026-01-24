import { prisma } from "./prisma";
import { headers } from "next/headers";

export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGE"
  | "EMAIL_VERIFIED"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "CREATE_BOOKING"
  | "UPDATE_BOOKING"
  | "CANCEL_BOOKING"
  | "CREATE_SERVICE"
  | "UPDATE_SERVICE"
  | "DELETE_SERVICE"
  | "ADMIN_ACCESS"
  | "2FA_ENABLED"
  | "2FA_DISABLED"
  | "2FA_VERIFIED"
  | "TOKEN_REVOKED"
  | "SUSPICIOUS_ACTIVITY";

interface AuditLogData {
  userId?: string | null;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  success?: boolean;
}

export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || undefined;

    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress,
        userAgent,
        success: data.success ?? true,
      },
    });
  } catch (error) {
    // Log de auditoria não deve quebrar a aplicação
    console.error("Audit log error:", error);
  }
}

// Funções de conveniência
export async function logLogin(userId: string, success: boolean, details?: Record<string, unknown>): Promise<void> {
  await logAudit({
    userId: success ? userId : null,
    action: success ? "LOGIN" : "LOGIN_FAILED",
    resource: "User",
    resourceId: userId,
    details: { ...details, attemptedUserId: userId },
    success,
  });
}

export async function logLogout(userId: string): Promise<void> {
  await logAudit({
    userId,
    action: "LOGOUT",
    resource: "User",
    resourceId: userId,
  });
}

export async function logPasswordChange(userId: string, method: "reset" | "change"): Promise<void> {
  await logAudit({
    userId,
    action: method === "reset" ? "PASSWORD_RESET" : "PASSWORD_CHANGE",
    resource: "User",
    resourceId: userId,
  });
}

export async function logUserAction(
  userId: string | null,
  action: AuditAction,
  resource: string,
  resourceId: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    userId,
    action,
    resource,
    resourceId,
    details,
  });
}

// Buscar logs de auditoria (para dashboard admin)
export async function getAuditLogs(options?: {
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};

  if (options?.userId) where.userId = options.userId;
  if (options?.action) where.action = options.action;
  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options?.startDate) (where.createdAt as Record<string, Date>).gte = options.startDate;
    if (options?.endDate) (where.createdAt as Record<string, Date>).lte = options.endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });
}

// Limpar logs antigos (manter últimos X dias)
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });
  return result.count;
}
