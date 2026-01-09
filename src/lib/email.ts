import nodemailer from "nodemailer";

// Configurar transporter do Nodemailer
// Usa Gmail ou outro servidor SMTP configurado nas variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || "noreply@terapiasmanuais.pt";
const FROM_NAME = process.env.SMTP_FROM_NAME || "Terapias Manuais Samuel";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log("Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${APP_URL}/verificar-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #166534 0%, #14532d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Terapias Manuais Samuel</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #166534; margin-top: 0;">Bem-vindo(a), ${name}!</h2>

        <p>Obrigado por se registar nas Terapias Manuais Samuel. Para começar a marcar as suas consultas, por favor confirme o seu email clicando no botão abaixo:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #166534; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Confirmar Email
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="color: #166534; font-size: 14px; word-break: break-all;">${verificationUrl}</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">
          Este link expira em 24 horas. Se não criou esta conta, pode ignorar este email.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Terapias Manuais Samuel. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Bem-vindo(a) - Confirme o seu email",
    html,
  });
}

export async function sendResendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${APP_URL}/verificar-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #166534 0%, #14532d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Terapias Manuais Samuel</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #166534; margin-top: 0;">Confirme o seu email, ${name}</h2>

        <p>Recebemos um pedido para reenviar o email de confirmação. Clique no botão abaixo para confirmar o seu email:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #166534; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Confirmar Email
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="color: #166534; font-size: 14px; word-break: break-all;">${verificationUrl}</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">
          Este link expira em 24 horas. Se não pediu este email, pode ignorá-lo.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Terapias Manuais Samuel. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Confirme o seu email - Terapias Manuais Samuel",
    html,
  });
}

// ============================================
// TEMPLATES DE EMAIL MARKETING
// ============================================

interface MarketingEmailParams {
  to: string;
  name: string;
  subject: string;
  flyerUrl?: string;
  customContent?: string;
}

// Template base para todos os emails de marketing
function getMarketingBaseTemplate(
  content: string,
  flyerUrl?: string,
  footerText?: string
): string {
  const flyerSection = flyerUrl
    ? `
      <div style="text-align: center; margin: 30px 0;">
        <img src="${flyerUrl}" alt="Promoção" style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
      <div style="background: linear-gradient(135deg, #166534 0%, #14532d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="${APP_URL}/logo-samuel1.png" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; border: 3px solid rgba(255,255,255,0.3);" />
        <h1 style="color: white; margin: 0; font-size: 24px;">Terapias Manuais Samuel</h1>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        ${content}
        ${flyerSection}

        <div style="text-align: center; margin-top: 30px;">
          <a href="${APP_URL}/marcacoes" style="background: #166534; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Marcar Consulta
          </a>
        </div>

        ${footerText ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"><p style="color: #6b7280; font-size: 12px; text-align: center;">${footerText}</p>` : ""}
      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Terapias Manuais Samuel. Todos os direitos reservados.</p>
        <p style="margin-top: 10px;">
          <a href="${APP_URL}" style="color: #166534; text-decoration: none;">Visitar Website</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

// Template: Promoção
export async function sendPromotionEmail({
  to,
  name,
  subject,
  flyerUrl,
  customContent,
}: MarketingEmailParams) {
  const content = `
    <h2 style="color: #166534; margin-top: 0;">Olá ${name}! 🎉</h2>
    ${
      customContent
        ? `<p>${customContent}</p>`
        : `
      <p>Temos uma <strong>promoção especial</strong> a pensar em si!</p>
      <p>Aproveite esta oportunidade única para cuidar de si com os nossos tratamentos de excelência.</p>
    `
    }
  `;

  const html = getMarketingBaseTemplate(
    content,
    flyerUrl,
    "Esta promoção é válida por tempo limitado. Não perca!"
  );

  return sendEmail({ to, subject, html });
}

// Template: Aviso de Férias
export async function sendHolidayNoticeEmail({
  to,
  name,
  subject,
  customContent,
  flyerUrl,
}: MarketingEmailParams & {
  startDate?: string;
  endDate?: string;
}) {
  const content = `
    <h2 style="color: #166534; margin-top: 0;">Olá ${name}! 🏖️</h2>
    ${
      customContent
        ? `<p>${customContent}</p>`
        : `
      <p>Gostaríamos de informar que estaremos <strong>encerrados para férias</strong>.</p>
      <p>Durante este período não será possível realizar marcações. Agradecemos a sua compreensão.</p>
      <p>Voltaremos em breve, prontos para continuar a cuidar do seu bem-estar!</p>
    `
    }
  `;

  const html = getMarketingBaseTemplate(
    content,
    flyerUrl,
    "Se tiver alguma urgência, deixe-nos uma mensagem através do nosso formulário de contacto."
  );

  return sendEmail({ to, subject: subject || "Aviso de Férias - Terapias Manuais Samuel", html });
}

// Template: Aviso de Horários
export async function sendScheduleNoticeEmail({
  to,
  name,
  subject,
  customContent,
  flyerUrl,
}: MarketingEmailParams) {
  const content = `
    <h2 style="color: #166534; margin-top: 0;">Olá ${name}! ⏰</h2>
    ${
      customContent
        ? `<p>${customContent}</p>`
        : `
      <p>Gostaríamos de informar sobre uma <strong>alteração nos nossos horários</strong>.</p>
      <p>Por favor, consulte os novos horários de atendimento para planear a sua próxima visita.</p>
    `
    }
  `;

  const html = getMarketingBaseTemplate(
    content,
    flyerUrl,
    "Se tiver alguma marcação agendada que seja afetada, entraremos em contacto consigo."
  );

  return sendEmail({ to, subject: subject || "Alteração de Horários - Terapias Manuais Samuel", html });
}

// Interface para configuração de aniversário
export interface BirthdayConfig {
  offerText: string;
  promoCode: string | null;
  offerValidDays: number;
  imageUrl: string | null;
  customMessage: string | null;
}

// Função para calcular idade a partir da data de nascimento
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Template: Feliz Aniversário (versão configurável)
export async function sendBirthdayEmailConfigurable({
  to,
  name,
  birthDate,
  config,
}: {
  to: string;
  name: string;
  birthDate: Date;
  config: BirthdayConfig;
}) {
  const age = calculateAge(birthDate);
  const firstName = name.split(" ")[0]; // Usar apenas primeiro nome para mais pessoal

  // Construir mensagem de oferta
  const offerSection = config.promoCode
    ? `
      <p style="text-align: center;">Para celebrar os seus <strong>${age} anos</strong>, oferecemos-lhe:</p>
      <p style="text-align: center; color: #166534; font-weight: bold; font-size: 20px;">${config.offerText}</p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #166534 0%, #14532d 100%); padding: 15px 30px; border-radius: 10px;">
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">USE O CÓDIGO</p>
          <p style="color: white; margin: 5px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${config.promoCode}</p>
        </div>
      </div>
    `
    : `
      <p style="text-align: center;">Para celebrar os seus <strong>${age} anos</strong>, oferecemos-lhe:</p>
      <p style="text-align: center; color: #166534; font-weight: bold; font-size: 20px;">${config.offerText}</p>
    `;

  const customMessageSection = config.customMessage
    ? `<p style="text-align: center; color: #6b7280; font-style: italic; margin-top: 20px;">${config.customMessage}</p>`
    : "";

  const content = `
    <div style="text-align: center;">
      <p style="font-size: 48px; margin: 0;">🎂</p>
      <h2 style="color: #166534; margin: 10px 0; font-size: 28px;">Feliz Aniversário, ${firstName}!</h2>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">Parabéns pelos ${age} anos!</p>
    </div>

    <p style="text-align: center;">Em nome de toda a equipa das <strong>Terapias Manuais Samuel</strong>, desejamos-lhe um dia muito especial e repleto de felicidades!</p>

    ${offerSection}
    ${customMessageSection}

    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 32px;">🎁 🎉 🎈</span>
    </div>
  `;

  const footerText = config.offerValidDays > 0
    ? `Esta oferta é válida durante ${config.offerValidDays} dias. Aproveite e cuide de si!`
    : "Aproveite e cuide de si!";

  const html = getMarketingBaseTemplate(content, config.imageUrl || undefined, footerText);

  return sendEmail({
    to,
    subject: `Feliz Aniversário, ${firstName}! 🎂 Os seus ${age} anos merecem ser celebrados!`,
    html,
  });
}

// Template: Feliz Aniversário (versão simples - mantida para compatibilidade)
export async function sendBirthdayEmail({
  to,
  name,
  flyerUrl,
  customContent,
}: Omit<MarketingEmailParams, "subject">) {
  const content = `
    <div style="text-align: center;">
      <h2 style="color: #166534; margin-top: 0; font-size: 28px;">Feliz Aniversário, ${name}! 🎂🎉</h2>
    </div>
    ${
      customContent
        ? `<p style="text-align: center;">${customContent}</p>`
        : `
      <p style="text-align: center;">Em nome de toda a equipa das <strong>Terapias Manuais Samuel</strong>, desejamos-lhe um dia muito especial!</p>
      <p style="text-align: center;">Para celebrar consigo, oferecemos-lhe <strong>10% de desconto</strong> na sua próxima consulta.</p>
      <p style="text-align: center; color: #166534; font-weight: bold; font-size: 18px;">Use o código: ANIVERSARIO10</p>
    `
    }
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 48px;">🎁</span>
    </div>
  `;

  const html = getMarketingBaseTemplate(
    content,
    flyerUrl,
    "Este desconto é válido durante 30 dias. Cuide de si!"
  );

  return sendEmail({
    to,
    subject: `Feliz Aniversário, ${name}! 🎂 - Terapias Manuais Samuel`,
    html,
  });
}

// Template: Email Personalizado (para campanhas customizadas)
export async function sendCustomCampaignEmail({
  to,
  name,
  subject,
  customContent,
  flyerUrl,
}: MarketingEmailParams) {
  const content = `
    <h2 style="color: #166534; margin-top: 0;">Olá ${name}!</h2>
    <div>${customContent || ""}</div>
  `;

  const html = getMarketingBaseTemplate(content, flyerUrl);

  return sendEmail({ to, subject, html });
}

// Função auxiliar para enviar emails em massa
export async function sendBulkEmails(
  recipients: Array<{ email: string; name: string }>,
  emailFunction: (params: MarketingEmailParams) => Promise<{ success: boolean; error?: unknown }>,
  baseParams: Omit<MarketingEmailParams, "to" | "name">
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      const result = await emailFunction({
        ...baseParams,
        to: recipient.email,
        name: recipient.name,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push(`${recipient.email}: ${result.error}`);
      }

      // Pequeno delay para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      errors.push(`${recipient.email}: ${error}`);
    }
  }

  return { sent, failed, errors };
}
