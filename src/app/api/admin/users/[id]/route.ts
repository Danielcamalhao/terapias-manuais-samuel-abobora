import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcrypt";

const updateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "CLIENT"]).optional(),
  clientType: z.enum(["NORMAL", "PREMIUM"]).optional(),
  phone: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  password: z.string().min(4).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const user = verifyAuth(token);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.clientType !== undefined) data.clientType = parsed.data.clientType;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;
  if (parsed.data.addressCity !== undefined) data.addressCity = parsed.data.addressCity;
  if (parsed.data.birthDate !== undefined) {
    data.birthDate = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
  }
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clientType: true,
      emailVerified: true,
      phone: true,
      birthDate: true,
      addressCity: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reutilizar PUT para PATCH
  return PUT(req, { params });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const user = verifyAuth(token);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // impedir apagar o próprio admin autenticado
  if (user.id === id) {
    return NextResponse.json({ error: "Não podes apagar a tua própria conta." }, { status: 400 });
  }

  // Buscar o utilizador a ser apagado
  const userToDelete = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, createdAt: true },
  });

  if (!userToDelete) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  // Verificar se é um administrador a ser apagado
  if (userToDelete.role === "ADMIN") {
    // Encontrar o administrador mais antigo (primeiro criado no sistema)
    const primaryAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    // Se o utilizador a apagar é o admin principal, bloquear
    if (primaryAdmin && primaryAdmin.id === id) {
      return NextResponse.json(
        { error: "O administrador principal não pode ser removido." },
        { status: 403 }
      );
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
