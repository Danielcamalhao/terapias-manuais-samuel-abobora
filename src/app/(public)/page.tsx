import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-20 md:py-32 overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Terapias Manuais
                <span className="block text-green-700 mt-2">Samuel Abóbora</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Ajudamos a restaurar o equilíbrio do seu corpo através de terapias manuais
                que promovem o bem-estar físico e mental.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/servicos"
                  className="inline-block bg-gradient-to-r from-green-700 to-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-xl hover:from-green-800 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
                >
                  Ver Serviços
                </Link>
                <Link
                  href="/contactos"
                  className="inline-block bg-white border-2 border-green-700 text-green-700 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300"
                >
                  Marcar Consulta
                </Link>
              </div>
            </div>

            {/* Imagem */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white/50 backdrop-blur-sm rounded-3xl shadow-2xl p-4 border border-white/60">
                <Image
                  src="/header-samuel.png"
                  alt="Terapias Manuais"
                  width={600}
                  height={400}
                  className="rounded-2xl object-cover w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Porque escolher as nossas terapias?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Oferecemos tratamentos personalizados com foco no seu bem-estar total
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Tratamento Personalizado",
                description: "Cada sessão é adaptada às suas necessidades específicas, garantindo os melhores resultados.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: "🏆",
                title: "Profissional Qualificado",
                description: "Terapeuta certificado com vasta experiência em técnicas manuais e osteopatia.",
                color: "from-green-600 to-emerald-500"
              },
              {
                icon: "💚",
                title: "Bem-Estar Integral",
                description: "Abordagem holística que considera corpo e mente para resultados duradouros.",
                color: "from-purple-500 to-pink-500"
              }
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para melhorar o seu bem-estar?
          </h2>
          <p className="text-xl text-green-50 mb-8 leading-relaxed">
            Agende a sua consulta hoje e comece a sentir-se melhor.
            Estamos aqui para ajudar na sua jornada de saúde e bem-estar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contactos"
              className="inline-block bg-white text-green-700 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Marcar Consulta
            </Link>
            <Link
              href="/auth/login"
              className="inline-block bg-green-800/50 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-800 transition-all duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
