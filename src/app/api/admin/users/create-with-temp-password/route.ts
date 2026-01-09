import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().nullable().optional(),
  role: z.enum(["CLIENT", "ADMIN"]),
  clientType: z.enum(["NORMAL", "PREMIUM"]),
  birthDate: z.string().nullable().optional(),
});

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { name, email, phone, role, clientType, birthDate } = parsed.data;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está registado" },
        { status: 400 }
      );
    }

    // Gerar password temporária
    const tempPassword = generateTempPassword();
    const tempPasswordHash = await bcrypt.hash(tempPassword, 10);

    // Gerar token de reset
    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Criar utilizador
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
        clientType,
        birthDate: birthDate ? new Date(birthDate) : null,
        passwordHash: tempPasswordHash, // Password temporária como hash principal
        tempPassword: tempPasswordHash,
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry,
        mustChangePassword: true,
        emailVerified: false,
      },
    });

    // Enviar email com password temporária
    await sendPasswordResetEmail(email, name, tempPassword, resetToken);

    return NextResponse.json({
      success: true,
      message: `Utilizador criado! Um email com a password temporária foi enviado para ${email}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    return NextResponse.json(
      { error: "Erro ao criar utilizador. Tente novamente." },
      { status: 500 }
    );
  }
}
