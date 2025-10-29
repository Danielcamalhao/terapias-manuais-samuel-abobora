import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";

// Schema de validação para criar marcação
const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  startAt: z.string().datetime(),
  notes: z.string().optional(),
});

// GET - Listar marcações do utilizador (ou todas se for admin)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Se for ADMIN, mostra todas as marcações
    // Se for CLIENT, mostra apenas as suas
    const where = user.role === "ADMIN" ? {} : { userId: user.id };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          select: {
            name: true,
            durationMin: true,
            priceCents: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { startAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("❌ Erro ao listar marcações:", error);
    return NextResponse.json(
      { error: "Erro ao carregar marcações" },
      { status: 500 }
    );
  }
}

// POST - Criar nova marcação
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { serviceId, startAt, notes } = parsed.data;

    // Buscar o serviço para obter a duração
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    // Calcular endAt baseado na duração do serviço
    const startDate = new Date(startAt);
    const endDate = new Date(startDate.getTime() + service.durationMin * 60000);

    // Verificar se já existe marcação nesse horário
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        OR: [
          {
            AND: [
              { startAt: { lte: startDate } },
              { endAt: { gt: startDate } },
            ],
          },
          {
            AND: [
              { startAt: { lt: endDate } },
              { endAt: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startAt: { gte: startDate } },
              { endAt: { lte: endDate } },
            ],
          },
        ],
        status: { not: "CANCELLED" },
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Já existe uma marcação para este horário" },
        { status: 409 }
      );
    }

    // Gerar código único para a marcação
    const code = `MRC${Date.now().toString().slice(-8)}`;

    // Criar marcação
    const booking = await prisma.booking.create({
      data: {
        code,
        userId: user.id,
        serviceId,
        startAt: startDate,
        endAt: endDate,
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        service: {
          select: {
            name: true,
            durationMin: true,
            priceCents: true,
          },
        },
      },
    });

    console.log(`✅ Marcação criada: ${code} para ${user.email}`);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao criar marcação:", error);
    return NextResponse.json(
      { error: "Erro ao criar marcação" },
      { status: 500 }
    );
  }
}
