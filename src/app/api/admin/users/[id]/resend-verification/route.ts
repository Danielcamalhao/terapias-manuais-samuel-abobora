import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResendVerificationEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar utilizador
    const user = await prisma.user.findUnique({
      where: { id },
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
