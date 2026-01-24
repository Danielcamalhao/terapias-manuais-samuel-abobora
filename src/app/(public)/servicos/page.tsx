import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 60; // Atualiza a cada 60s no modo produção

export default async function ServicosPage() {
  const servicos = await prisma.service.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      {/* Cabeçalho */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-green-800 mb-4">Serviços</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Descubra as terapias manuais disponíveis e encontre o tratamento ideal
          para o seu bem-estar físico e mental.
        </p>
      </div>

      {/* Grelha */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {servicos.length === 0 && (
          <p className="text-gray-500 text-center col-span-full">
            Nenhum serviço disponível de momento.
          </p>
        )}

        {servicos.map((s) => (
          <Link
            key={s.id}
            href={`/servicos/${s.slug}`}
            className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
          >
            {/* Imagem */}
            <div className="relative h-56 w-full bg-gray-100">
              <Image
                src={s.imageUrl || "/placeholder-service.jpg"}
                alt={s.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-2 group-hover:underline">
                {s.name}
              </h2>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {s.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-lg font-bold text-gray-800">
                  {(s.priceCents / 100).toFixed(2)} €
                </span>
                <span className="text-sm text-gray-500">
                  {s.durationMin} min
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
