import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AgendarButton from "@/components/AgendarButton";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

// Revalida a cada 60s
export const revalidate = 60;

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await prisma.service.findUnique({
    where: { slug },
  });

  if (!service || !service.active) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-xl overflow-hidden">
        {/* Imagem principal */}
        <div className="relative w-full h-80 sm:h-96 bg-gray-100">
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
            <AgendarButton serviceId={service!.id} />
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
