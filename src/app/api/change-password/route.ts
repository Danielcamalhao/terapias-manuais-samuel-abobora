import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const changePasswordSchema = z.object({
  token: z.string().uuid(),
  tempPassword: z.string().min(1, "Password temporária é obrigatória"),
  newPassword: z.string().min(6, "A nova password deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As passwords não coincidem",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { token, tempPassword, newPassword } = parsed.data;

    // Buscar utilizador pelo token
    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: token },
      select: {
        id: true,
        tempPassword: true,
        resetPasswordExpiry: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Por favor, contacte o administrador." },
        { status: 400 }
      );
    }

    // Verificar se o token expirou
    if (user.resetPasswordExpiry && new Date() > user.resetPasswordExpiry) {
      return NextResponse.json(
        { error: "Este link expirou. Por favor, contacte o administrador para gerar uma nova password." },
        { status: 400 }
      );
    }

    // Verificar password temporária
    if (!user.tempPassword) {
      return NextResponse.json(
        { error: "Erro no processo de reset. Por favor, contacte o administrador." },
        { status: 400 }
      );
    }

    const tempPasswordValid = await bcrypt.compare(tempPassword, user.tempPassword);
    if (!tempPasswordValid) {
      return NextResponse.json(
        { error: "Password temporária incorreta." },
        { status: 400 }
      );
    }

    // Hash da nova password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Atualizar utilizador com nova password e limpar campos de reset
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        tempPassword: null,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password alterada com sucesso! Já pode fazer login.",
    });
  } catch (error) {
    console.error("Erro ao alterar password:", error);
    return NextResponse.json(
      { error: "Erro ao processar pedido. Tente novamente." },
      { status: 500 }
    );
  }
}

// GET para validar se o token é válido
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Token não fornecido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { resetPasswordToken: token },
    select: {
      name: true,
      email: true,
      resetPasswordExpiry: true,
    },
  });

  if (!user) {
    return NextResponse.json({ valid: false, error: "Token inválido" }, { status: 400 });
  }

  if (user.resetPasswordExpiry && new Date() > user.resetPasswordExpiry) {
    return NextResponse.json({ valid: false, error: "Token expirado" }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    name: user.name,
    email: user.email,
  });
}
