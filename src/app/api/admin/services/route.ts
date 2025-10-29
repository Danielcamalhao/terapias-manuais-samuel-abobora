import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";
import slugify from "slugify";

// 🔹 Validação dos dados de serviço
const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0),
  durationMin: z.number().int().min(1),
  active: z.boolean().default(true),
  imageUrl: z.string().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
});

// 🔹 GET — listar todos os serviços (para o backoffice e público)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    // Permite acesso público, mas se o user for ADMIN, mostra tudo
    const where = user?.role === "ADMIN" ? {} : { active: true };

    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Garante que devolve sempre um array
    return NextResponse.json(Array.isArray(services) ? services : []);
  } catch (error) {
    console.error("❌ Erro no GET /api/admin/services:", error);
    return NextResponse.json(
      { error: "Erro ao carregar serviços." },
      { status: 500 }
    );
  }
}

// 🔹 POST — criar novo serviço
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = serviceSchema.safeParse({
      ...body,
      priceCents: Number(body.priceCents),
      durationMin: Number(body.durationMin),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const newService = await prisma.service.create({
      data: {
        name: data.name,
        slug: slugify(data.name, { lower: true }),
        description: data.description || "",
        priceCents: data.priceCents,
        durationMin: data.durationMin,
        active: data.active,
        imageUrl: data.imageUrl || null,
        imagePublicId: data.imagePublicId || null,
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("❌ Erro no POST /api/admin/services:", error);
    return NextResponse.json(
      { error: "Erro ao criar serviço." },
      { status: 500 }
    );
  }
}
