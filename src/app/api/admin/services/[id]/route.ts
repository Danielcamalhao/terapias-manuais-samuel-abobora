import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";
import slugify from "slugify";
import { v2 as cloudinary } from "cloudinary";

// 🔹 Configuração Cloudinary (usa as variáveis do .env.local)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// 🔹 Esquema de validação para atualização
const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0).optional(),
  durationMin: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
});

// 🔹 PUT — atualizar serviço
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = token ? verifyAuth(token) : null;
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Preparar dados para atualização, tratando explicitamente o campo description
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priceCents !== undefined) updateData.priceCents = data.priceCents;
    if (data.durationMin !== undefined) updateData.durationMin = data.durationMin;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imagePublicId !== undefined) updateData.imagePublicId = data.imagePublicId;
    if (data.name) updateData.slug = slugify(data.name, { lower: true });

    // Atualiza slug se o nome mudar
    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Erro no PUT /api/admin/services/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar serviço" },
      { status: 500 }
    );
  }
}

// 🔹 DELETE — remover serviço + imagem no Cloudinary
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = token ? verifyAuth(token) : null;
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Primeiro buscar o serviço para obter o publicId da imagem
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    // Se tiver imagem no Cloudinary, apaga
    if (service.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(service.imagePublicId);
        console.log(`🧹 Imagem ${service.imagePublicId} removida do Cloudinary.`);
      } catch (err) {
        console.warn("⚠️ Erro ao eliminar imagem do Cloudinary:", err);
      }
    }

    // Finalmente elimina o serviço da BD
    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no DELETE /api/admin/services/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao eliminar serviço" },
      { status: 500 }
    );
  }
}
