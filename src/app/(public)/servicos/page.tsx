"use client";

import Image from "next/image";
import Link from "next/link";
import { mockServicos } from "@/data/mockServicos";

export default function ServicosPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-gray-100 px-6 py-24 overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent-emerald/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold tracking-wider text-primary-600 uppercase bg-primary-100 px-4 py-2 rounded-full">
              Nossos Tratamentos
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-extrabold mb-6">
            <span className="gradient-text">Serviços</span>{" "}
            <span className="text-primary-700">Especializados</span>
          </h1>
          <p className="text-gray-700 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Descubra as terapias manuais disponíveis e encontre o tratamento ideal
            para o seu bem-estar e recuperação física.
          </p>
        </div>

        {/* Grid de serviços com cards futuristas */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 max-w-6xl mx-auto">
          {mockServicos.map((servico, idx) => (
            <div
              key={servico.id}
              className="group relative bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 animate-slide-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Glow effect no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-accent-emerald/0 to-accent-cyan/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />

              {/* Imagem com overlay gradiente */}
              <div className="relative w-full h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                <Image
                  src={servico.imagem}
                  alt={servico.nome}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Badge de duração flutuante */}
                <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-bold text-primary-700">{servico.duracao} min</span>
                </div>

                {/* Título sobre a imagem */}
                <div className="absolute bottom-4 left-6 z-20">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-white drop-shadow-lg">
                    {servico.nome}
                  </h2>
                </div>
              </div>

              {/* Conteúdo do card */}
              <div className="p-6 space-y-4">
                <p className="text-gray-700 text-base leading-relaxed min-h-[60px]">
                  {servico.descricao}
                </p>

                {/* Footer com preço e botão */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Preço</span>
                    <span className="text-3xl font-display font-bold text-primary-600">
                      {servico.preco}
                    </span>
                  </div>

                  <Link
                    href="/marcacoes"
                    className="group/btn relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-500 to-accent-emerald text-white px-6 py-3 rounded-xl font-bold shadow-neon-sm hover:shadow-neon-md transition-all duration-300 hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Agendar
                      <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/0 via-accent-cyan/30 to-accent-cyan/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  </Link>
                </div>
              </div>

              {/* Borda decorativa animada */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-emerald to-accent-cyan transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>

        {/* Call to action adicional */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-emerald rounded-3xl p-8 md:p-12 shadow-neon-md">
            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Não encontrou o que procura?
            </h3>
            <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
              Entre em contacto connosco para saber mais sobre outros tratamentos disponíveis ou para agendar uma consulta personalizada.
            </p>
            <Link
              href="/contactos"
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              Contactar Agora
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
