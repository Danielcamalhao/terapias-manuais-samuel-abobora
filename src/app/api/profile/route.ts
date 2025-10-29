import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcrypt";

// Schema para atualizar perfil
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  birthDate: z.string().datetime().optional().nullable(),
  profession: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressPost: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
  oldPassword: z.string().optional(),
});

// GET - Obter perfil do utilizador autenticado
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        birthDate: true,
        profession: true,
        addressCity: true,
        addressPost: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("❌ Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao carregar perfil" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar perfil do utilizador
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.birthDate !== undefined)
      updateData.birthDate = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
    if (parsed.data.profession !== undefined)
      updateData.profession = parsed.data.profession;
    if (parsed.data.addressCity !== undefined)
      updateData.addressCity = parsed.data.addressCity;
    if (parsed.data.addressPost !== undefined)
      updateData.addressPost = parsed.data.addressPost;

    // Atualizar password se fornecida
    if (parsed.data.password) {
      // Verificar se foi fornecida a password antiga
      if (!parsed.data.oldPassword) {
        return NextResponse.json(
          { error: "Palavra-passe atual é obrigatória" },
          { status: 400 }
        );
      }

      // Buscar utilizador com password para validar
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });

      if (!userWithPassword) {
        return NextResponse.json(
          { error: "Utilizador não encontrado" },
          { status: 404 }
        );
      }

      // Validar password antiga
      const isOldPasswordValid = await bcrypt.compare(
        parsed.data.oldPassword,
        userWithPassword.passwordHash
      );

      if (!isOldPasswordValid) {
        return NextResponse.json(
          { error: "Palavra-passe atual incorreta" },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    }

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        birthDate: true,
        profession: true,
        addressCity: true,
        addressPost: true,
        createdAt: true,
      },
    });

    console.log(`✅ Perfil atualizado para ${user.email}`);

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("❌ Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
