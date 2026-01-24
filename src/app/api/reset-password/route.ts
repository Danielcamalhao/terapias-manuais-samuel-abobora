import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e password são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A password deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Buscar utilizador pelo token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          gt: new Date(), // Token ainda não expirou
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Por favor, solicite um novo." },
        { status: 400 }
      );
    }

    // Hash da nova password
    const passwordHash = await bcrypt.hash(password, 10);

    // Atualizar password e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        mustChangePassword: false,
        tempPassword: null,
      },
    });

    console.log(`✅ Password alterada com sucesso para: ${user.email}`);

    return NextResponse.json(
      { message: "Palavra-passe alterada com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao alterar password:", error);
    return NextResponse.json(
      { error: "Erro ao alterar password" },
      { status: 500 }
    );
  }
}
