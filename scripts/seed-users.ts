import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 A iniciar seed de utilizadores...");

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@terapias.pt" },
    update: {},
    create: {
      name: "Samuel Abóbora",
      email: "admin@terapias.pt",
      passwordHash: adminPassword,
      role: "ADMIN",
      phone: "+351 912 345 678",
    },
  });

  console.log("✅ Admin criado:", admin.email);

  // Client user
  const clientPassword = await bcrypt.hash("cliente123", 10);
  const client = await prisma.user.upsert({
    where: { email: "cliente@exemplo.pt" },
    update: {},
    create: {
      name: "João Silva",
      email: "cliente@exemplo.pt",
      passwordHash: clientPassword,
      role: "CLIENT",
      phone: "+351 918 765 432",
    },
  });

  console.log("✅ Cliente criado:", client.email);

  console.log("\n📋 Credenciais de teste:");
  console.log("\n🔐 ADMIN:");
  console.log("   Email: admin@terapias.pt");
  console.log("   Password: admin123");
  console.log("\n👤 CLIENTE:");
  console.log("   Email: cliente@exemplo.pt");
  console.log("   Password: cliente123");
  console.log("\n✨ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
