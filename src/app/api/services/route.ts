import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("❌ Erro no GET /api/services:", error);
    return NextResponse.json(
      { error: "Erro ao carregar serviços" },
      { status: 500 }
    );
  }
}
