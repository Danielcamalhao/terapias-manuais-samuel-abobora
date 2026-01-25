import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      rating,
      improvementAreas,
      wantsPromotions,
      suggestions,
      clientName,
      clientEmail,
    } = body;

    // Validação básica
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Avaliação inválida (deve ser entre 1 e 5)" },
        { status: 400 }
      );
    }

    // Criar resposta do inquérito
    const surveyResponse = await prisma.surveyResponse.create({
      data: {
        rating: Number(rating),
        improvementAreas: improvementAreas || [],
        wantsPromotions: wantsPromotions ?? null,
        suggestions: suggestions || null,
        clientName: clientName || null,
        clientEmail: clientEmail || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: surveyResponse.id,
    });
  } catch (err) {
    console.error("Erro ao guardar resposta do inquérito:", err);
    return NextResponse.json(
      { error: "Erro ao guardar resposta" },
      { status: 500 }
    );
  }
}
