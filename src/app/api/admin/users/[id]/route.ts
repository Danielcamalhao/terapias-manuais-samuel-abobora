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
  phone: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  password: z.string().min(4).optional(), // se quiseres alterar a password
});

export async function PATCH(
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: any = { ...parsed.data };
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  // impedir apagar/alterar "super admin" opcionalmente:
  // if (id === "ID-DO-SUPER-ADMIN") ...

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, phone: true, addressCity: true, createdAt: true },
  });

  return NextResponse.json(updated);
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

  // impedir apagar o próprio admin autenticado (opcional mas recomendado)
  if (user.id === id) {
    return NextResponse.json({ error: "Não podes apagar a tua própria conta." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
