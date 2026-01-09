import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBirthdayEmailConfigurable, BirthdayConfig } from "@/lib/email";

// Esta rota é chamada pelo Vercel Cron diariamente às 9h
// Vercel injeta automaticamente o header 'Authorization: Bearer <CRON_SECRET>'

const CRON_SECRET = process.env.CRON_SECRET;

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

export async function GET(request: NextRequest) {
  // Verificar autenticação do Vercel Cron
  const authHeader = request.headers.get("authorization");

  if (!CRON_SECRET) {
    console.error("CRON_SECRET não está definido");
    return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error("Tentativa de acesso não autorizada ao cron");
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  console.log("🕐 Cron de aniversários iniciado");

  try {
    const config = await getBirthdayConfig();

    if (!config.enabled) {
      console.log("📧 Envio automático de aniversários está desativado");
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

    console.log(`🎂 Encontrados ${birthdayUsers.length} aniversariantes hoje`);

    if (birthdayUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum aniversariante hoje",
        sent: 0,
      });
    }

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
          htmlContent: `Envio automático via cron: ${config.offerText}${config.promoCode ? ` (Código: ${config.promoCode})` : ""}`,
          sentTo: sent,
          sentAt: new Date(),
        },
      });
    }

    console.log(`📧 Cron concluído: ${sent} enviados, ${failed} falhados`);

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
    console.error("Erro no cron de aniversários:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
