import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcrypt";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(4),
  role: z.enum(["ADMIN", "CLIENT"]).default("CLIENT"),
  phone: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
});

export async function GET() {
  // proteger admin
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const user = verifyAuth(token);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, name: true, role: true,
      phone: true, addressCity: true, createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const user = verifyAuth(token);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, name, password, role, phone, addressCity } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: { email, name, passwordHash, role, phone, addressCity },
    select: { id: true, email: true, name: true, role: true, phone: true, addressCity: true, createdAt: true },
  });

  return NextResponse.json(created, { status: 201 });
}
