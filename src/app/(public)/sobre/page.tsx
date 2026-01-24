import { prisma } from "@/lib/prisma";

async function getSettings() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "site-settings" },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: "site-settings" },
      });
    }

    return settings;
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    return null;
  }
}

export default async function SobrePage() {
  const settings = await getSettings();

  const aboutTitle = settings?.aboutTitle || "Sobre";
  const aboutText1 = settings?.aboutText1 || "O projeto Terapias Manuais Samuel Abóbora nasceu da paixão por promover a saúde e o bem-estar através do toque humano e da sabedoria do corpo. Acreditamos que cada pessoa é única, e que o tratamento deve ser personalizado, respeitando o ritmo natural de cura do organismo.";
  const aboutText2 = settings?.aboutText2 || "Samuel Abóbora é terapeuta manual especializado em osteopatia e terapias complementares, com mais de 10 anos de experiência na área.";

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-6">{aboutTitle}</h1>
        <p className="text-gray-700 leading-relaxed mb-6">
          {aboutText1}
        </p>
        <p className="text-gray-700 leading-relaxed">
          {aboutText2}
        </p>
      </div>
    </main>
  );
}
