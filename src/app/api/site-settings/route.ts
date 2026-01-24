import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

const SETTINGS_ID = "site-settings";

// GET - Obter configurações do site (público)
export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    // Se não existir, criar com valores padrão
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: SETTINGS_ID },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações do site:", error);
    return NextResponse.json(
      { error: "Erro ao carregar configurações" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações do site (apenas admin)
export async function PUT(req: Request) {
  try {
    // Verificar autenticação
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    // Atualizar ou criar configurações
    const settings = await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        // Hero Section
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        heroDescription: body.heroDescription,
        heroImageUrl: body.heroImageUrl,
        heroImagePublicId: body.heroImagePublicId,
        // Benefícios
        benefitsTitle: body.benefitsTitle,
        benefitsSubtitle: body.benefitsSubtitle,
        benefit1Title: body.benefit1Title,
        benefit1Description: body.benefit1Description,
        benefit2Title: body.benefit2Title,
        benefit2Description: body.benefit2Description,
        benefit3Title: body.benefit3Title,
        benefit3Description: body.benefit3Description,
        // CTA
        ctaTitle: body.ctaTitle,
        ctaDescription: body.ctaDescription,
        // Sobre
        aboutTitle: body.aboutTitle,
        aboutText1: body.aboutText1,
        aboutText2: body.aboutText2,
        // Footer
        footerDescription: body.footerDescription,
        footerEmail: body.footerEmail,
        footerPhone: body.footerPhone,
      },
      create: {
        id: SETTINGS_ID,
        ...body,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao atualizar configurações do site:", error);
    return NextResponse.json(
      { error: "Erro ao guardar configurações" },
      { status: 500 }
    );
  }
}
