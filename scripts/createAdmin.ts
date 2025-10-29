import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ⚙️ Define aqui o email e password desejados
const ADMIN_EMAIL = "terapiasmanuaisabobora@gmail.com"; // ✅ recomendo usar .com normal
const ADMIN_PASSWORD = "1234";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      role: "ADMIN",
      name: "Samuel Abóbora",
      phone: "968633307",
      addressCity: "Queluz",
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      name: "Samuel Abóbora",
      phone: "968633307",
      addressCity: "Queluz",
    },
  });

  console.log("✅ ADMIN criado/atualizado com sucesso:");
  console.log(admin);
}

main()
  .catch((e) => console.error("❌ Erro:", e))
  .finally(async () => await prisma.$disconnect());
