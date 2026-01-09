import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "@/lib/email";

// Gerar password aleatória de 8 caracteres
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const adminUser = verifyAuth(token);

  if (!adminUser || adminUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Buscar o utilizador
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    // Gerar password temporária e token de reset
    const tempPassword = generateTempPassword();
    const tempPasswordHash = await bcrypt.hash(tempPassword, 10);
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Atualizar utilizador com password temporária e token
    await prisma.user.update({
      where: { id },
      data: {
        tempPassword: tempPasswordHash,
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry,
        mustChangePassword: true,
      },
    });

    // Enviar email com password temporária e link de reset
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.name,
      tempPassword,
      resetToken
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password temporária enviada para ${user.email}`,
    });
  } catch (error) {
    console.error("Erro ao resetar password:", error);
    return NextResponse.json(
      { error: "Erro ao processar pedido" },
      { status: 500 }
    );
  }
}
