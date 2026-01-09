import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const CONFIG_ID = "birthday-config";

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

// Configuração padrão
const defaultConfig = {
  enabled: true,
  offerText: "10% de desconto na sua próxima consulta",
  promoCode: "ANIVERSARIO10",
  offerValidDays: 30,
  imageUrl: null,
  customMessage: null,
};

// GET - Obter configuração atual
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    let config = await prisma.birthdayEmailConfig.findUnique({
      where: { id: CONFIG_ID },
    });

    // Se não existir, criar com valores padrão
    if (!config) {
      config = await prisma.birthdayEmailConfig.create({
        data: {
          id: CONFIG_ID,
          ...defaultConfig,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao obter configuração:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT - Atualizar configuração
export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { enabled, offerText, promoCode, offerValidDays, imageUrl, customMessage } = body;

    // Upsert - criar ou atualizar
    const config = await prisma.birthdayEmailConfig.upsert({
      where: { id: CONFIG_ID },
      update: {
        enabled: enabled ?? true,
        offerText: offerText || defaultConfig.offerText,
        promoCode: promoCode || null,
        offerValidDays: offerValidDays ?? 30,
        imageUrl: imageUrl || null,
        customMessage: customMessage || null,
      },
      create: {
        id: CONFIG_ID,
        enabled: enabled ?? true,
        offerText: offerText || defaultConfig.offerText,
        promoCode: promoCode || null,
        offerValidDays: offerValidDays ?? 30,
        imageUrl: imageUrl || null,
        customMessage: customMessage || null,
      },
    });

    console.log("📧 Configuração de aniversário atualizada");

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
