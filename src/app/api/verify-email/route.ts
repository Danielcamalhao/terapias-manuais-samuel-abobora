import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token de verificação em falta" },
        { status: 400 }
      );
    }

    // Procurar utilizador com este token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou já utilizado" },
        { status: 400 }
      );
    }

    // Verificar se o token expirou
    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      return NextResponse.json(
        { error: "O link de verificação expirou. Por favor, solicite um novo." },
        { status: 400 }
      );
    }

    // Atualizar utilizador como verificado
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    console.log(`✅ Email verificado: ${user.email}`);

    return NextResponse.json(
      { message: "Email verificado com sucesso! Já pode iniciar sessão." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro na verificação de email:", error);
    return NextResponse.json(
      { error: "Erro ao verificar email" },
      { status: 500 }
    );
  }
}
