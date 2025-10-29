// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().nullable(),
  message: z.string().min(5, "Mensagem demasiado curta"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, phone, message } = parsed.data;

    const created = await prisma.contact.create({
      data: { name, email, phone, message },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error("Erro ao guardar contacto:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
