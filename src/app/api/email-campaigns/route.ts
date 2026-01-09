import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendPromotionEmail,
  sendHolidayNoticeEmail,
  sendScheduleNoticeEmail,
  sendCustomCampaignEmail,
} from "@/lib/email";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Verificar se é admin
async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token || !JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "ADMIN") return null;
    return decoded;
  } catch {
    return null;
  }
}

// GET - Listar campanhas enviadas
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Erro ao listar campanhas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Enviar nova campanha
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      type, // PROMOCAO, FERIAS, HORARIOS, PERSONALIZADO
      subject,
      content,
      flyerUrl,
      targetType, // NORMAL, PREMIUM, ou null para todos
      selectedUserIds, // Array de IDs específicos (opcional)
    } = body;

    if (!type || !subject) {
      return NextResponse.json(
        { error: "Tipo e assunto são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar destinatários
    let recipients;

    if (selectedUserIds && selectedUserIds.length > 0) {
      // Enviar para utilizadores específicos
      recipients = await prisma.user.findMany({
        where: {
          id: { in: selectedUserIds },
          role: "CLIENT",
          emailVerified: true,
        },
        select: { id: true, email: true, name: true },
      });
    } else if (targetType) {
      // Enviar para um tipo específico de cliente
      recipients = await prisma.user.findMany({
        where: {
          role: "CLIENT",
          clientType: targetType,
          emailVerified: true,
        },
        select: { id: true, email: true, name: true },
      });
    } else {
      // Enviar para todos os clientes verificados
      recipients = await prisma.user.findMany({
        where: {
          role: "CLIENT",
          emailVerified: true,
        },
        select: { id: true, email: true, name: true },
      });
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "Nenhum destinatário encontrado" },
        { status: 400 }
      );
    }

    // Selecionar função de envio baseada no tipo
    const emailFunctions: Record<string, typeof sendPromotionEmail> = {
      PROMOCAO: sendPromotionEmail,
      FERIAS: sendHolidayNoticeEmail,
      HORARIOS: sendScheduleNoticeEmail,
      PERSONALIZADO: sendCustomCampaignEmail,
    };

    const sendFunction = emailFunctions[type] || sendCustomCampaignEmail;

    // Enviar emails
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const result = await sendFunction({
          to: recipient.email,
          name: recipient.name,
          subject,
          flyerUrl,
          customContent: content,
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${recipient.email}: Erro no envio`);
        }

        // Pequeno delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        failed++;
        errors.push(`${recipient.email}: ${error}`);
      }
    }

    // Guardar campanha na base de dados
    const campaign = await prisma.emailCampaign.create({
      data: {
        type: type as "PROMOCAO" | "FERIAS" | "HORARIOS" | "PERSONALIZADO",
        subject,
        htmlContent: content || "",
        flyerUrl,
        targetType: targetType || null,
        sentTo: sent,
        sentAt: new Date(),
      },
    });

    console.log(`📧 Campanha enviada: ${sent} emails, ${failed} falhados`);

    return NextResponse.json({
      success: true,
      campaign,
      stats: {
        total: recipients.length,
        sent,
        failed,
        errors: errors.slice(0, 10), // Limitar erros retornados
      },
    });
  } catch (error) {
    console.error("Erro ao enviar campanha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
