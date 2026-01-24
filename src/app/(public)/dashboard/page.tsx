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
  endAt: string;
  status: string;
  notes: string | null;
  service: {
    name: string;
    durationMin: number;
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

  // Função para gerar URL do Google Calendar
  const generateGoogleCalendarUrl = (booking: Booking) => {
    const startDate = new Date(booking.startAt);
    const endDate = new Date(booking.endAt);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    };

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${booking.service.name} - Terapias Manuais Samuel`,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Marcação confirmada: ${booking.service.name}\nCódigo: ${booking.code}\nDuração: ${booking.service.durationMin} minutos${booking.notes ? `\nNotas: ${booking.notes}` : ""}`,
      location: "Terapias Manuais Samuel",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Função para descarregar ficheiro ICS
  const downloadIcsFile = (booking: Booking) => {
    const startDate = new Date(booking.startAt);
    const endDate = new Date(booking.endAt);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Terapias Manuais Samuel//PT
BEGIN:VEVENT
UID:${booking.id}@terapiasmanuaissamuel.pt
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${booking.service.name} - Terapias Manuais Samuel
DESCRIPTION:Marcação confirmada: ${booking.service.name}\\nCódigo: ${booking.code}\\nDuração: ${booking.service.durationMin} minutos${booking.notes ? `\\nNotas: ${booking.notes}` : ""}
LOCATION:Terapias Manuais Samuel
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marcacao-${booking.code}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  const now = new Date();
  const activeBookings = bookings.filter(
    (b) => (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.startAt) > now
  );
  const completedBookings = bookings.filter(
    (b) => new Date(b.startAt) <= now || b.status === "COMPLETED"
  );
  const upcomingBookings = activeBookings
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const nextBooking = upcomingBookings[0];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-yellow-50", text: "text-yellow-600", label: "Pendente" },
      CONFIRMED: { bg: "bg-green-50", text: "text-green-600", label: "Confirmada" },
      CANCELLED: { bg: "bg-orange-50", text: "text-orange-600", label: "Cancelada" },
      NO_SHOW: { bg: "bg-red-50", text: "text-red-600", label: "Faltou" },
      COMPLETED: { bg: "bg-blue-50", text: "text-blue-600", label: "Realizada" },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-100 px-6 py-12">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-green-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Cabeçalho com Título e Ações */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Área de Cliente</h1>
              <p className="text-gray-500 text-sm">Gerencie as suas marcações e dados pessoais</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="self-start md:self-auto bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium text-sm transition hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Terminar Sessão
          </button>
        </div>

        {/* Aviso de Email não verificado */}
        {!profile.emailVerified && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Email não verificado</h3>
                  <p className="text-amber-700 text-xs mt-0.5">
                    Verifique o seu email para ter acesso a todas as funcionalidades.
                  </p>
                  {verificationMessage && (
                    <p className={`text-xs mt-1 font-medium ${
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
                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {resendingVerification ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    A enviar...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Reenviar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Ações Rápidas - Botões menores */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/marcacoes"
            className="group bg-gradient-to-r from-green-700 to-emerald-600 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Agendar Sessão</p>
                <p className="text-white/70 text-xs">Reserve o seu tratamento</p>
              </div>
            </div>
          </Link>

          <Link
            href="/perfil"
            className="group bg-white border border-gray-200 text-gray-700 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-green-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Meu Perfil</p>
                <p className="text-gray-500 text-xs">Editar dados pessoais</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Próximas Marcações */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Próximas Marcações
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Não tem marcações agendadas</p>
              <Link href="/marcacoes" className="text-green-600 text-sm font-medium hover:text-green-700 mt-2 inline-block">
                Agendar agora →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => {
                const startDate = new Date(booking.startAt);
                return (
                  <div
                    key={booking.id}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{booking.service.name}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {startDate.toLocaleDateString("pt-PT", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {startDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botões de calendário para confirmadas */}
                    {booking.status === "CONFIRMED" && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-gray-500 mb-2">Adicionar ao Calendário:</p>
                        <div className="flex gap-2">
                          <a
                            href={generateGoogleCalendarUrl(booking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-green-300 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-50 transition"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm1-8h4v2h-6V7h2v5z"/>
                            </svg>
                            Google
                          </a>
                          <button
                            onClick={() => downloadIcsFile(booking)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-green-300 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-50 transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            iCal/Outlook
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Histórico de Marcações Realizadas */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Histórico de Sessões
          </h2>

          {completedBookings.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">Ainda não realizou nenhuma sessão</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {completedBookings
                .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
                .slice(0, 10)
                .map((booking) => {
                  const startDate = new Date(booking.startAt);
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{booking.service.name}</p>
                          <p className="text-xs text-gray-500">
                            {startDate.toLocaleDateString("pt-PT", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {startDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
          {completedBookings.length > 10 && (
            <Link href="/marcacoes" className="text-green-600 text-sm font-medium hover:text-green-700 mt-3 inline-block">
              Ver histórico completo →
            </Link>
          )}
        </div>

        {/* Dashboard - Estatísticas */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Resumo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Marcações Activas */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Marcações Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{activeBookings.length}</p>
                </div>
              </div>
            </div>

            {/* Próxima Sessão */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center shadow">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Próxima Sessão</p>
                  <p className="text-lg font-bold text-gray-900">
                    {nextBooking
                      ? new Date(nextBooking.startAt).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Total de Sessões Realizadas */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Sessões Realizadas</p>
                  <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
