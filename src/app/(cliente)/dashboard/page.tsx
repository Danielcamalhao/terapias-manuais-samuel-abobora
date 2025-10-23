"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClienteDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    // Verificar localStorage apenas no cliente
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const mockMarcacoes = [
    {
      id: 1,
      servico: "Osteopatia",
      data: "10/11/2025",
      hora: "15:00",
      estado: "Confirmada",
      duracao: 60,
    },
    {
      id: 2,
      servico: "Massagem de Relaxamento",
      data: "20/11/2025",
      hora: "10:30",
      estado: "Pendente",
      duracao: 45,
    },
  ];

  if (!user) return null;

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-gray-100 px-6 py-24 overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-accent-emerald/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Cabeçalho com glassmorphism */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-glass border border-white/50 p-8 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-emerald rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-neon-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-700">
                    Olá, {user.name}!
                  </h1>
                  <p className="text-gray-600 text-sm">Bem-vindo à sua área pessoal</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="group relative overflow-hidden bg-red-500/10 backdrop-blur-sm border-2 border-red-500/30 text-red-600 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Terminar Sessão
              </span>
            </button>
          </div>
        </div>

        {/* Grid de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Marcações Ativas", value: "2", icon: "📅", color: "from-blue-500 to-cyan-500" },
            { label: "Próxima Sessão", value: "10/11", icon: "⏰", color: "from-primary-500 to-accent-emerald" },
            { label: "Sessões Totais", value: "12", icon: "✅", color: "from-purple-500 to-pink-500" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-glass border border-white/50 p-6 animate-slide-up hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-3xl font-display font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Ações rápidas */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-glass border border-white/50 p-8 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-display font-bold text-primary-700 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-emerald rounded-xl flex items-center justify-center text-white shadow-neon-sm">
              ⚡
            </div>
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/marcacoes"
              className="group relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-500 to-accent-emerald text-white p-6 rounded-2xl shadow-neon-sm hover:shadow-neon-md transition-all duration-300 hover:scale-105"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg mb-1">Agendar Nova Sessão</p>
                  <p className="text-white/80 text-sm">Reserve o seu próximo tratamento</p>
                </div>
                <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/0 via-accent-cyan/30 to-accent-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>

            <Link
              href="/servicos"
              className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-2 border-primary-500/30 text-primary-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary-500"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg mb-1">Ver Serviços</p>
                  <p className="text-gray-600 text-sm">Conheça todos os tratamentos</p>
                </div>
                <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Lista de marcações com design futurista */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-glass border border-white/50 p-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-2xl font-display font-bold text-primary-700 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-emerald rounded-xl flex items-center justify-center text-white shadow-neon-sm">
              📋
            </div>
            As suas Marcações
          </h2>

          <div className="space-y-4">
            {mockMarcacoes.map((m, idx) => (
              <div
                key={m.id}
                className="group relative bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-primary-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
              >
                {/* Barra lateral colorida baseada no estado */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${
                  m.estado === "Confirmada" ? "bg-gradient-to-b from-green-500 to-emerald-600" : "bg-gradient-to-b from-yellow-500 to-orange-500"
                }`} />

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                        m.estado === "Confirmada" ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-yellow-500 to-orange-500"
                      }`}>
                        {m.servico.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-xl text-gray-900">{m.servico}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {m.duracao} minutos
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">{m.data}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">{m.hora}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl font-bold text-sm shadow-md ${
                      m.estado === "Confirmada"
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                        : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                    }`}>
                      {m.estado}
                    </span>
                    <button className="w-10 h-10 bg-gray-200 hover:bg-primary-100 rounded-xl flex items-center justify-center transition-colors group">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {mockMarcacoes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">Ainda não tem marcações</p>
              <Link
                href="/marcacoes"
                className="inline-block mt-4 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors"
              >
                Agendar Primeira Sessão
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
