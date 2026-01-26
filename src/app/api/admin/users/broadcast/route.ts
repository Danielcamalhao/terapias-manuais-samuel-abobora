import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

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

    // Enviar emails reais
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://terapias-manuais.vercel.app";
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #166534 0%, #14532d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Terapias Manuais Samuel</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #166534; margin-top: 0;">Olá ${recipient.name}!</h2>
            <div style="white-space: pre-line;">${message}</div>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Terapias Manuais Samuel. Todos os direitos reservados.</p>
            <p><a href="${APP_URL}" style="color: #166534;">Visitar Website</a></p>
          </div>
        </body>
        </html>
      `;

      try {
        const result = await sendEmail({
          to: recipient.email,
          subject,
          html,
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
          console.error(`❌ Falha ao enviar para ${recipient.email}:`, result.error);
        }

        // Delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        failed++;
        console.error(`❌ Erro ao enviar para ${recipient.email}:`, err);
      }
    }

    console.log(`✅ Broadcast concluído: ${sent} enviados, ${failed} falhados`);
    return NextResponse.json({ sent, failed });
  } catch (error) {
    console.error("❌ Erro ao enviar broadcast clientes:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
