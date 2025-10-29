import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ServicePageProps {
  params: { slug: string };
}

// Revalida a cada 60s
export const revalidate = 60;

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const service = await prisma.service.findUnique({
    where: { slug: params.slug },
  });

  if (!service || !service.active) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-xl overflow-hidden">
        {/* Imagem principal */}
        <div className="relative w-full h-80 sm:h-96">
          <Image
            src={service.imageUrl || "/placeholder-service.jpg"}
            alt={service.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Conteúdo */}
        <div className="p-8">
          <h1 className="text-3xl font-bold text-green-800 mb-4">
            {service.name}
          </h1>

          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            {service.description || "Sem descrição disponível."}
          </p>

          <div className="flex items-center gap-6 mb-6">
            <p className="text-lg font-semibold text-gray-900">
              💶 {(service.priceCents / 100).toFixed(2)} €
            </p>
            <p className="text-lg text-gray-700">⏱ {service.durationMin} min</p>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <Link
              href="/contactos"
              className="bg-green-700 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-800 transition"
            >
              Agendar Sessão
            </Link>
            <Link
              href="/servicos"
              className="text-green-700 hover:underline font-medium flex items-center"
            >
              ← Voltar aos serviços
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
