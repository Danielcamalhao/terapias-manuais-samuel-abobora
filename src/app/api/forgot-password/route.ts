import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendForgotPasswordEmail } from "@/lib/email";
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

    // Por segurança, não revelamos se o email existe ou não
    if (!user) {
      return NextResponse.json(
        { message: "Se o email existir, receberá instruções para redefinir a palavra-passe." },
        { status: 200 }
      );
    }

    // Gerar token de reset (expira em 1 hora)
    const resetToken = randomUUID();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Atualizar utilizador com token de reset
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry,
      },
    });

    // Enviar email
    const emailResult = await sendForgotPasswordEmail(
      user.email,
      user.name,
      resetToken
    );

    if (!emailResult.success) {
      console.error("Erro ao enviar email de reset:", emailResult.error);
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      );
    }

    console.log(`✅ Email de reset de password enviado para: ${user.email}`);

    return NextResponse.json(
      { message: "Se o email existir, receberá instruções para redefinir a palavra-passe." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao processar pedido de reset:", error);
    return NextResponse.json(
      { error: "Erro ao processar pedido" },
      { status: 500 }
    );
  }
}
