import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-100 pt-24 pb-16 overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-emerald/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-cyan/5 rounded-full blur-3xl" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 px-6 max-w-7xl mx-auto">
        {/* IMAGEM DE DESTAQUE com efeito futurista */}
        <div className="mb-12 animate-fade-in">
          <div className="relative inline-block">
            {/* Glow effect atrás da imagem */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-accent-emerald to-accent-cyan opacity-20 blur-2xl rounded-3xl scale-105" />

            <div className="relative rounded-3xl overflow-hidden shadow-3d ring-4 ring-white/50 backdrop-blur-sm">
              <Image
                src="/header-samuel.png"
                alt="Logo Terapias Manuais Samuel Abóbora"
                width={900}
                height={900}
                className="mx-auto transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>

        {/* TÍTULO com gradiente */}
        <h1 className="text-5xl md:text-7xl font-display font-extrabold mb-6 animate-slide-up">
          <span className="gradient-text">
            Terapias Manuais
          </span>
          <br />
          <span className="text-primary-700">
            de Samuel Abóbora
          </span>
        </h1>

        {/* DESCRIÇÃO */}
        <p className="max-w-3xl mx-auto text-gray-700 mb-10 text-lg md:text-xl leading-relaxed animate-slide-up font-light" style={{ animationDelay: '0.2s' }}>
          Espaço especializado em <strong className="text-primary-600 font-semibold">osteopatia</strong>,
          <strong className="text-primary-600 font-semibold"> massagens terapêuticas</strong> e
          <strong className="text-primary-600 font-semibold"> desportivas</strong>.
          <br />
          Agende a sua sessão e sinta o equilíbrio no corpo e na mente.
        </p>

        {/* BOTÕES CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/servicos"
            className="group relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-500 to-accent-emerald text-white px-8 py-4 rounded-xl font-bold text-lg shadow-neon-md hover:shadow-neon-lg transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              Ver Serviços
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/0 via-accent-cyan/30 to-accent-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>

          <Link
            href="/contactos"
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-2 border-primary-500 text-primary-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white"
          >
            <span className="relative z-10 flex items-center gap-2">
              Entrar em Contacto
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
          </Link>
        </div>

        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          {[
            { icon: "✨", title: "Profissionalismo", desc: "Atendimento personalizado e dedicado" },
            { icon: "🎯", title: "Especializado", desc: "Técnicas avançadas de terapia manual" },
            { icon: "💚", title: "Bem-estar", desc: "Foco no seu equilíbrio e saúde" }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-white/50"
              style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-display font-bold text-xl text-primary-700 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
