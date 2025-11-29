import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const broadcastSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(3),
  userIds: z.array(z.string().uuid()).optional(),
  sendToAll: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || "";
    const user = verifyAuth(token);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { subject, message, userIds, sendToAll } = parsed.data;

    const recipients =
      sendToAll || !userIds?.length
        ? await prisma.user.findMany({
            where: { role: "CLIENT" },
            select: { email: true, name: true },
          })
        : await prisma.user.findMany({
            where: { id: { in: userIds }, role: "CLIENT" },
            select: { email: true, name: true },
          });

    const emails = recipients
      .map((r) => r.email)
      .filter(Boolean)
      .filter((email, idx, arr) => arr.indexOf(email) === idx);

    console.log(
      `📧 Broadcast clientes "${subject}" para ${emails.length} destinatários:`,
      emails
    );

    // Integração de email real pode ser adicionada aqui.
    return NextResponse.json({ sent: emails.length });
  } catch (error) {
    console.error("❌ Erro ao enviar broadcast clientes:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
