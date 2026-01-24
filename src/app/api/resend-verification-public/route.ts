import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResendVerificationEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar utilizador pelo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por segurança, não revelamos se o email existe ou não
      return NextResponse.json(
        { message: "Se o email existir, receberá um email de verificação." },
        { status: 200 }
      );
    }

    // Verificar se já está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email já está verificado. Faça login normalmente." },
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

    // Enviar email
    const emailResult = await sendResendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    if (!emailResult.success) {
      console.error("Erro ao reenviar email:", emailResult.error);
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      );
    }

    console.log(`✅ Email de verificação reenviado para: ${user.email}`);

    return NextResponse.json(
      { message: "Email de verificação enviado com sucesso!" },
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
