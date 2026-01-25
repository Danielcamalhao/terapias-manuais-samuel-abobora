import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const surveys = await prisma.surveyResponse.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(surveys);
  } catch (err) {
    console.error("Erro ao buscar inquéritos:", err);
    return NextResponse.json(
      { error: "Erro ao buscar inquéritos" },
      { status: 500 }
    );
  }
}
