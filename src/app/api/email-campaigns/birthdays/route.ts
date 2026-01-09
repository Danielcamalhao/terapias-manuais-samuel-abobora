import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBirthdayEmailConfigurable, BirthdayConfig } from "@/lib/email";
import jwt from "jsonwebtoken";

// Esta API pode ser chamada via cron job (ex: Vercel Cron, GitHub Actions, etc.)
// Para segurança, usa um token secreto ou verifica que é chamada internamente

const CRON_SECRET = process.env.CRON_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

// Configuração padrão caso não exista na BD
const defaultConfig: BirthdayConfig = {
  offerText: "10% de desconto na sua próxima consulta",
  promoCode: "ANIVERSARIO10",
  offerValidDays: 30,
  imageUrl: null,
  customMessage: null,
};

// Buscar configuração da BD
async function getBirthdayConfig(): Promise<BirthdayConfig & { enabled: boolean }> {
  try {
    const config = await prisma.birthdayEmailConfig.findUnique({
      where: { id: "birthday-config" },
    });

    if (config) {
      return {
        enabled: config.enabled,
        offerText: config.offerText,
        promoCode: config.promoCode,
        offerValidDays: config.offerValidDays,
        imageUrl: config.imageUrl,
        customMessage: config.customMessage,
      };
    }
  } catch (error) {
    console.error("Erro ao buscar configuração:", error);
  }

  return { ...defaultConfig, enabled: true };
}

export async function POST(request: NextRequest) {
  // Verificar autorização (cron secret, admin cookie, ou desenvolvimento)
  const authHeader = request.headers.get("authorization");
  const cronSecret = authHeader?.replace("Bearer ", "");
  const token = request.cookies.get("token")?.value;

  let isAuthorized = false;

  // Verificar cron secret
  if (CRON_SECRET && cronSecret === CRON_SECRET) {
    isAuthorized = true;
  }

  // Verificar admin cookie
  if (!isAuthorized && token && JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
      if (decoded.role === "ADMIN") {
        isAuthorized = true;
      }
    } catch {
      // Token inválido
    }
  }

  // Em desenvolvimento, permitir sem autenticação
  if (!isAuthorized && !CRON_SECRET && process.env.NODE_ENV === "development") {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // Buscar configuração
    const config = await getBirthdayConfig();

    // Verificar se está ativado
    if (!config.enabled) {
      return NextResponse.json({
        success: true,
        message: "Envio de aniversários está desativado",
        sent: 0,
      });
    }

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;

    // Buscar utilizadores que fazem anos hoje
    const birthdayUsers = await prisma.$queryRaw<
      Array<{ id: string; email: string; name: string; birthDate: Date }>
    >`
      SELECT id, email, name, "birthDate"
      FROM "User"
      WHERE role = 'CLIENT'
        AND "emailVerified" = true
        AND "birthDate" IS NOT NULL
        AND EXTRACT(DAY FROM "birthDate") = ${currentDay}
        AND EXTRACT(MONTH FROM "birthDate") = ${currentMonth}
    `;

    if (birthdayUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum aniversariante hoje",
        sent: 0,
      });
    }

    // Enviar emails de aniversário
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of birthdayUsers) {
      try {
        const result = await sendBirthdayEmailConfigurable({
          to: user.email,
          name: user.name,
          birthDate: new Date(user.birthDate),
          config: {
            offerText: config.offerText,
            promoCode: config.promoCode,
            offerValidDays: config.offerValidDays,
            imageUrl: config.imageUrl,
            customMessage: config.customMessage,
          },
        });

        if (result.success) {
          sent++;
          console.log(`🎂 Email de aniversário enviado para ${user.email}`);
        } else {
          failed++;
          errors.push(`${user.email}: Erro no envio`);
        }

        // Pequeno delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        failed++;
        errors.push(`${user.email}: ${error}`);
      }
    }

    // Registar como campanha de aniversário
    if (sent > 0) {
      await prisma.emailCampaign.create({
        data: {
          type: "ANIVERSARIO",
          subject: "Feliz Aniversário! - Terapias Manuais Samuel",
          htmlContent: `Envio automático: ${config.offerText}${config.promoCode ? ` (Código: ${config.promoCode})` : ""}`,
          sentTo: sent,
          sentAt: new Date(),
        },
      });
    }

    console.log(`📧 Emails de aniversário: ${sent} enviados, ${failed} falhados`);

    return NextResponse.json({
      success: true,
      stats: {
        total: birthdayUsers.length,
        sent,
        failed,
        errors: errors.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Erro ao enviar emails de aniversário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// GET - Pode ser usado para:
// 1. Vercel Cron (com header CRON_SECRET) - dispara envio de emails
// 2. Admin (com cookie token) - apenas lista aniversariantes
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = authHeader?.replace("Bearer ", "");
  const token = request.cookies.get("token")?.value;

  // Vercel Cron também pode usar query parameter para autenticação
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  // Se for chamada do Vercel Cron, executar envio de emails
  const isValidCron = CRON_SECRET && (cronSecret === CRON_SECRET || querySecret === CRON_SECRET);
  if (isValidCron) {
    // Reutilizar a lógica do POST para enviar emails
    try {
      const config = await getBirthdayConfig();

      if (!config.enabled) {
        return NextResponse.json({
          success: true,
          message: "Envio de aniversários está desativado",
          sent: 0,
        });
      }

      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1;

      const birthdayUsers = await prisma.$queryRaw<
        Array<{ id: string; email: string; name: string; birthDate: Date }>
      >`
        SELECT id, email, name, "birthDate"
        FROM "User"
        WHERE role = 'CLIENT'
          AND "emailVerified" = true
          AND "birthDate" IS NOT NULL
          AND EXTRACT(DAY FROM "birthDate") = ${currentDay}
          AND EXTRACT(MONTH FROM "birthDate") = ${currentMonth}
      `;

      if (birthdayUsers.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Nenhum aniversariante hoje",
          sent: 0,
        });
      }

      let sent = 0;
      let failed = 0;

      for (const user of birthdayUsers) {
        try {
          const result = await sendBirthdayEmailConfigurable({
            to: user.email,
            name: user.name,
            birthDate: new Date(user.birthDate),
            config: {
              offerText: config.offerText,
              promoCode: config.promoCode,
              offerValidDays: config.offerValidDays,
              imageUrl: config.imageUrl,
              customMessage: config.customMessage,
            },
          });

          if (result.success) {
            sent++;
            console.log(`🎂 Email de aniversário enviado para ${user.email}`);
          } else {
            failed++;
          }

          await new Promise((resolve) => setTimeout(resolve, 150));
        } catch {
          failed++;
        }
      }

      if (sent > 0) {
        await prisma.emailCampaign.create({
          data: {
            type: "ANIVERSARIO",
            subject: "Feliz Aniversário! - Terapias Manuais Samuel",
            htmlContent: `Envio automático via cron: ${config.offerText}`,
            sentTo: sent,
            sentAt: new Date(),
          },
        });
      }

      console.log(`📧 Cron - Emails de aniversário: ${sent} enviados, ${failed} falhados`);

      return NextResponse.json({
        success: true,
        stats: { total: birthdayUsers.length, sent, failed },
      });
    } catch (error) {
      console.error("Erro no cron de aniversários:", error);
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  }

  // Se não for cron, verificar se é admin
  if (!token || !JWT_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;

    // Buscar aniversariantes
    const birthdayUsers = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        name: string;
        birthDate: Date;
        clientType: string;
        emailVerified: boolean;
      }>
    >`
      SELECT id, email, name, "birthDate", "clientType", "emailVerified"
      FROM "User"
      WHERE role = 'CLIENT'
        AND "birthDate" IS NOT NULL
        AND EXTRACT(DAY FROM "birthDate") = ${currentDay}
        AND EXTRACT(MONTH FROM "birthDate") = ${currentMonth}
    `;

    // Calcular idade
    const usersWithAge = birthdayUsers.map((u) => {
      const birth = new Date(u.birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        clientType: u.clientType,
        emailVerified: u.emailVerified,
        age,
      };
    });

    return NextResponse.json({
      date: today.toISOString().split("T")[0],
      count: birthdayUsers.length,
      verifiedCount: birthdayUsers.filter((u) => u.emailVerified).length,
      users: usersWithAge,
    });
  } catch (error) {
    console.error("Erro ao buscar aniversariantes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
