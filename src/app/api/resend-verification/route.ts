import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResendVerificationEmail } from "@/lib/email";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    // Verificar autenticação
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const auth = await verifyAuth(token);

    if (!auth) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar utilizador
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email já está verificado" },
        { status: 400 }
      );
    }

    // Gerar novo token (expira em 24 horas)
    const verificationToken = randomUUID();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Atualizar utilizador com novo token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpiry,
      },
    });

    // Verificar se variáveis SMTP estão configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("❌ Variáveis SMTP não configuradas");
      return NextResponse.json(
        { error: "Configuração de email em falta. Contacte o administrador." },
        { status: 500 }
      );
    }

    // Enviar email
    const emailResult = await sendResendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    if (!emailResult.success) {
      const errorMessage = emailResult.error instanceof Error
        ? emailResult.error.message
        : String(emailResult.error);
      console.error("Erro ao reenviar email:", errorMessage);
      return NextResponse.json(
        { error: `Erro ao enviar email: ${errorMessage}` },
        { status: 500 }
      );
    }

    console.log(`✅ Email de verificação reenviado para: ${user.email}`);

    return NextResponse.json(
      { message: "Email de verificação reenviado com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao reenviar email:", error);
    return NextResponse.json(
      { error: "Erro ao reenviar email" },
      { status: 500 }
    );
  }
}
