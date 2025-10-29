import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";

// Schema para atualizar marcação
const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW"]).optional(),
  notes: z.string().optional().nullable(),
  startAt: z.string().datetime().optional(),
});

// PATCH - Atualizar marcação
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const body = await req.json();
    const parsed = updateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verificar se a marcação existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Marcação não encontrada" },
        { status: 404 }
      );
    }

    // Clientes só podem atualizar as suas próprias marcações
    if (user.role !== "ADMIN" && existingBooking.userId !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão para atualizar esta marcação" },
        { status: 403 }
      );
    }

    const updateData: any = {};

    // Status pode ser alterado por admin ou pelo próprio cliente (apenas para cancelar)
    if (parsed.data.status) {
      if (
        user.role === "ADMIN" ||
        (parsed.data.status === "CANCELLED" && existingBooking.userId === user.id)
      ) {
        updateData.status = parsed.data.status;
      } else {
        return NextResponse.json(
          { error: "Sem permissão para alterar o status" },
          { status: 403 }
        );
      }
    }

    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes;
    }

    // Atualizar horário (apenas admin)
    if (parsed.data.startAt && user.role === "ADMIN") {
      const newStartDate = new Date(parsed.data.startAt);
      const newEndDate = new Date(
        newStartDate.getTime() + existingBooking.service.durationMin * 60000
      );

      // Verificar conflitos (excluindo a própria marcação)
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          OR: [
            {
              AND: [
                { startAt: { lte: newStartDate } },
                { endAt: { gt: newStartDate } },
              ],
            },
            {
              AND: [
                { startAt: { lt: newEndDate } },
                { endAt: { gte: newEndDate } },
              ],
            },
            {
              AND: [
                { startAt: { gte: newStartDate } },
                { endAt: { lte: newEndDate } },
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

      updateData.startAt = newStartDate;
      updateData.endAt = newEndDate;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
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
    });

    console.log(`✅ Marcação ${id} atualizada por ${user.email}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Erro ao atualizar marcação:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar marcação" },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar/Remover marcação
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se a marcação existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Marcação não encontrada" },
        { status: 404 }
      );
    }

    // Clientes só podem cancelar as suas próprias marcações
    if (user.role !== "ADMIN" && existingBooking.userId !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão para cancelar esta marcação" },
        { status: 403 }
      );
    }

    // Admin pode apagar completamente, cliente só cancela
    if (user.role === "ADMIN") {
      await prisma.booking.delete({ where: { id } });
      console.log(`🗑️ Marcação ${id} removida por admin ${user.email}`);
    } else {
      await prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      console.log(`❌ Marcação ${id} cancelada por cliente ${user.email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro ao cancelar marcação:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar marcação" },
      { status: 500 }
    );
  }
}
