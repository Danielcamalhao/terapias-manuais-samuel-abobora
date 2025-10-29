import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Horário de trabalho padrão
const WORK_HOURS = {
  start: 9, // 09:00
  end: 19, // 19:00
  slotDuration: 30, // 30 minutos por slot
};

// GET - Obter horários disponíveis para uma data e serviço
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // formato: YYYY-MM-DD
    const serviceIdParam = searchParams.get("serviceId");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Parâmetro 'date' é obrigatório" },
        { status: 400 }
      );
    }

    // Parse da data
    const requestedDate = new Date(dateParam + "T00:00:00");

    // Verificar se a data é válida e não é passado
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return NextResponse.json(
        { error: "Não é possível marcar para datas passadas" },
        { status: 400 }
      );
    }

    // Verificar se não é domingo (dia de descanso)
    const dayOfWeek = requestedDate.getDay();
    if (dayOfWeek === 0) {
      return NextResponse.json({
        date: dateParam,
        availableSlots: [],
        message: "Encerrado aos domingos",
      });
    }

    // Buscar duração do serviço (se fornecido)
    let serviceDuration = WORK_HOURS.slotDuration;
    if (serviceIdParam) {
      const service = await prisma.service.findUnique({
        where: { id: serviceIdParam },
      });
      if (service) {
        serviceDuration = service.durationMin;
      }
    }

    // Gerar todos os slots possíveis do dia
    const allSlots: Date[] = [];
    const dateStart = new Date(requestedDate);
    dateStart.setHours(WORK_HOURS.start, 0, 0, 0);

    const dateEnd = new Date(requestedDate);
    dateEnd.setHours(WORK_HOURS.end, 0, 0, 0);

    let currentSlot = new Date(dateStart);

    while (currentSlot < dateEnd) {
      // Verificar se há tempo suficiente para o serviço
      const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);
      if (slotEnd <= dateEnd) {
        allSlots.push(new Date(currentSlot));
      }
      currentSlot = new Date(currentSlot.getTime() + WORK_HOURS.slotDuration * 60000);
    }

    // Buscar marcações existentes para o dia
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        startAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: { not: "CANCELLED" },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    });

    // Filtrar slots disponíveis (que não colidem com marcações existentes)
    const availableSlots = allSlots.filter((slot) => {
      const slotEnd = new Date(slot.getTime() + serviceDuration * 60000);

      // Verificar se o slot está no passado (para hoje)
      const now = new Date();
      if (
        requestedDate.toDateString() === now.toDateString() &&
        slot < now
      ) {
        return false;
      }

      // Verificar se colide com alguma marcação existente
      const hasConflict = existingBookings.some((booking) => {
        return (
          (slot >= booking.startAt && slot < booking.endAt) ||
          (slotEnd > booking.startAt && slotEnd <= booking.endAt) ||
          (slot <= booking.startAt && slotEnd >= booking.endAt)
        );
      });

      return !hasConflict;
    });

    // Formatar resposta
    const formattedSlots = availableSlots.map((slot) => ({
      startAt: slot.toISOString(),
      startTime: slot.toTimeString().slice(0, 5), // HH:MM
      endTime: new Date(slot.getTime() + serviceDuration * 60000)
        .toTimeString()
        .slice(0, 5),
    }));

    return NextResponse.json({
      date: dateParam,
      dayOfWeek: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][dayOfWeek],
      serviceDuration,
      totalSlots: allSlots.length,
      availableSlots: formattedSlots,
      bookedSlots: existingBookings.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar horários disponíveis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários disponíveis" },
      { status: 500 }
    );
  }
}
