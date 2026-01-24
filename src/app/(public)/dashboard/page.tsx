"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}

interface Booking {
  id: string;
  code: string;
  startAt: string;
  status: string;
  service: {
    name: string;
  };
}

export default function ClienteDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar perfil
      const profileRes = await fetch("/api/profile");
      if (profileRes.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!profileRes.ok) throw new Error("Erro ao carregar perfil");
      const profileData = await profileRes.json();
      setProfile(profileData);

      // Buscar marcações
      const bookingsRes = await fetch("/api/bookings");
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.filter((b: Booking) => b.status !== "CANCELLED"));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      localStorage.removeItem("user");
      router.push("/auth/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setVerificationMessage(null);

    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationMessage({ type: "success", text: "Email enviado! Verifique a sua caixa de correio." });
      } else {
        setVerificationMessage({ type: "error", text: data.error || "Erro ao enviar email" });
      }
    } catch {
      setVerificationMessage({ type: "error", text: "Erro ao processar pedido" });
    } finally {
      setResendingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!profile) return null;

  // Calcular estatísticas
  const activeBookings = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED"
  );
  const nextBooking = activeBookings
    .filter((b) => new Date(b.startAt) > new Date())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-100 px-6 py-12">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-green-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Olá, {profile.name}!
                  </h1>
                  <p className="text-gray-600 text-sm">Bem-vindo à sua área pessoal</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-50 border-2 border-red-200 text-red-600 px-6 py-3 rounded-xl font-semibold transition hover:bg-red-500 hover:text-white hover:border-red-500"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Terminar Sessão
              </span>
            </button>
          </div>
        </div>

        {/* Aviso de Email não verificado */}
        {!profile.emailVerified && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-800">Email não verificado</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Por favor, verifique o seu email para ter acesso a todas as funcionalidades.
                    Verifique a sua caixa de correio (incluindo spam).
                  </p>
                  {verificationMessage && (
                    <p className={`text-sm mt-2 font-medium ${
                      verificationMessage.type === "success" ? "text-green-700" : "text-red-700"
                    }`}>
                      {verificationMessage.text}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {resendingVerification ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    A enviar...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Reenviar Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                📅
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Marcações Ativas</p>
            <p className="text-3xl font-bold text-gray-900">{activeBookings.length}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                ⏰
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Próxima Sessão</p>
            <p className="text-3xl font-bold text-gray-900">
              {nextBooking
                ? new Date(nextBooking.startAt).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                : "-"}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                ✅
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Sessões Totais</p>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              ⚡
            </div>
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/marcacoes"
              className="group relative overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg mb-1">Agendar Sessão</p>
                  <p className="text-white/80 text-sm">Reserve o seu próximo tratamento</p>
                </div>
                <svg
                  className="w-8 h-8 group-hover:translate-x-2 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </Link>

            <Link
              href="/perfil"
              className="group bg-white border-2 border-green-500/30 text-green-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-green-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg mb-1">Meu Perfil</p>
                  <p className="text-gray-600 text-sm">Editar informações pessoais</p>
                </div>
                <svg
                  className="w-8 h-8 group-hover:translate-x-2 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Próximas Marcações */}
        {nextBooking && (
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Próxima Marcação</h2>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {nextBooking.service.name}
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">
                        {new Date(nextBooking.startAt).toLocaleDateString("pt-PT", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">
                        {new Date(nextBooking.startAt).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm">
                  {nextBooking.status === "CONFIRMED" ? "Confirmada" : "Pendente"}
                </span>
              </div>

              <Link
                href="/marcacoes"
                className="mt-4 inline-block text-green-700 font-semibold hover:text-green-800"
              >
                Ver todas as marcações →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
