import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { getAuditLogs, AuditAction } from "@/lib/audit-log";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") as AuditAction | undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const logs = await getAuditLogs({
      userId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });

    // Formatar logs para resposta
    const formattedLogs = logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return NextResponse.json(formattedLogs);
  } catch (err) {
    console.error("Erro ao buscar audit logs:", err);
    return NextResponse.json(
      { error: "Erro ao buscar registos de auditoria" },
      { status: 500 }
    );
  }
}
