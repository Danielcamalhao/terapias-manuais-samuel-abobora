import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "terapiasmanuaisabobora@gmail.com";
  const password = "1234";
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("⚠️ O utilizador admin já existe:", existing.email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name: "Samuel Abóbora",
      role: "ADMIN",
      phone: "912345678",
      addressCity: "Lisboa",
    },
  });

  console.log("✅ Utilizador admin criado com sucesso:");
  console.log(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
