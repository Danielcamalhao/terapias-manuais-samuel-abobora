import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, "Palavra-passe deve ter pelo menos 6 caracteres"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está registado" },
        { status: 400 }
      );
    }

    // Hash da password
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar utilizador
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "CLIENT", // Por defeito, novos registos são clientes
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log(`✅ Novo utilizador registado: ${email}`);

    return NextResponse.json(
      { message: "Conta criada com sucesso", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erro no registo:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    );
  }
}
