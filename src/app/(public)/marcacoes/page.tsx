"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DatePicker from "@/components/DatePicker";
import {
  Calendar,
  dateFnsLocalizer,
  type SlotInfo,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import {
  addMinutes,
  differenceInMinutes,
  format,
  getDay,
  parse,
  startOfWeek,
  addWeeks,
} from "date-fns";
import { pt } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
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
    priceCents: number;
  };
}

interface AvailableSlot {
  startAt: string;
  startTime: string;
  endTime: string;
}

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: string;
  durationMin?: number;
  isDraft?: boolean;
};

const locales = { "pt-PT": pt, pt };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1, locale: pt }),
  getDay,
  locales,
});
const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

function MarcacoesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  // Formulário de nova marcação
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [draftEvent, setDraftEvent] = useState<CalendarEvent | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [filterPeriod, setFilterPeriod] = useState<"future" | "history">("future");

  useEffect(() => {
    // Verificar autenticação e status de verificação de email
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/login?redirect=/marcacoes");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (!parsedUser.emailVerified) {
        setEmailNotVerified(true);
      }
    } catch {
      router.push("/auth/login?redirect=/marcacoes");
      return;
    }

    // Verificar se há serviceId na URL
    const serviceId = searchParams.get("serviceId");
    if (serviceId) {
      setSelectedService(serviceId);
    }

    fetchData();
  }, [router, searchParams]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlot("");
    }
  }, [selectedService, selectedDate]);

  const fetchData = async () => {
    try {
      // Buscar serviços
      const servicesRes = await fetch("/api/services");
      if (!servicesRes.ok) throw new Error("Erro ao carregar serviços");
      const servicesData = await servicesRes.json();
      setServices(servicesData.filter((s: any) => s.active));

      // Buscar minhas marcações
      const bookingsRes = await fetch("/api/bookings");
      if (bookingsRes.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!bookingsRes.ok) throw new Error("Erro ao carregar marcações");
      const bookingsData = await bookingsRes.json();
      setMyBookings(bookingsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot("");

    try {
      const url = `/api/bookings/available-slots?date=${selectedDate}&serviceId=${selectedService}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar horários");

      const data = await res.json();
      setAvailableSlots(data.availableSlots || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const slotToUse = draftEvent ? draftEvent.start.toISOString() : selectedSlot;
    if (!slotToUse) {
      setError("Por favor selecione um horário");
      return;
    }

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService,
          startAt: slotToUse,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao criar marcação");
      }

      setSuccess("Marcação criada com sucesso!");
      setSelectedService("");
      setSelectedDate("");
      setSelectedSlot("");
      setNotes("");
      setDraftEvent(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta marcação?")) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao cancelar marcação");
      }

      setSuccess("Marcação cancelada com sucesso!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-yellow-50", text: "text-yellow-600", label: "Pendente" },
      CONFIRMED: { bg: "bg-green-50", text: "text-green-600", label: "Confirmada" },
      CANCELLED: { bg: "bg-orange-50", text: "text-orange-600", label: "Cancelada" },
      NO_SHOW: { bg: "bg-red-50", text: "text-red-600", label: "Faltou" },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Função para gerar URL do Google Calendar
  const generateGoogleCalendarUrl = (booking: Booking) => {
    const startDate = new Date(booking.startAt);
    const endDate = new Date(booking.endAt);

    // Formato: YYYYMMDDTHHmmssZ
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

  // Função para gerar e descarregar ficheiro ICS (Apple Calendar, Outlook, etc.)
  const downloadIcsFile = (booking: Booking) => {
    const startDate = new Date(booking.startAt);
    const endDate = new Date(booking.endAt);

    // Formato ICS: YYYYMMDDTHHmmssZ
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

  const calendarEvents = useMemo(() => {
    const baseEvents: CalendarEvent[] = myBookings.map((booking) => ({
      id: booking.id,
      title: booking.service.name,
      start: new Date(booking.startAt),
      end: new Date(booking.endAt),
      status: booking.status,
      durationMin: booking.service.durationMin,
    }));

    return draftEvent ? [...baseEvents, draftEvent] : baseEvents;
  }, [myBookings, draftEvent]);

  // Filtrar marcações por período
  const filteredBookings = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return myBookings.filter((booking) => {
      const bookingDate = new Date(booking.startAt);
      bookingDate.setHours(0, 0, 0, 0);

      if (filterPeriod === "future" && bookingDate < now) return false;
      if (filterPeriod === "history" && bookingDate >= now) return false;

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.startAt).getTime();
      const dateB = new Date(b.startAt).getTime();
      return filterPeriod === "future" ? dateA - dateB : dateB - dateA;
    });
  }, [myBookings, filterPeriod]);

  const eventPropGetter = (event: CalendarEvent) => {
    if (event.isDraft) {
      return {
        style: {
          backgroundColor: "rgba(22, 163, 74, 0.12)",
          color: "#0f172a",
          border: "1px dashed #16a34a",
          borderRadius: "10px",
        },
      };
    }

    const colors: Record<string, string> = {
      CONFIRMED: "#16a34a",  // verde
      PENDING: "#f59e0b",    // amarelo
      CANCELLED: "#f97316",  // laranja
      NO_SHOW: "#ef4444",    // vermelho
    };

    const background = colors[event.status || "PENDING"] || "#16a34a";

    return {
      style: {
        backgroundColor: background,
        color: "#fff",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.05)",
      },
    };
  };

  const updateDraftEvent = (start: Date, duration: number) => {
    const end = addMinutes(start, duration);
    setDraftEvent((prev) => ({
      id: "draft",
      title: prev?.title || "Nova marcação",
      start,
      end,
      isDraft: true,
      durationMin: duration,
    }));
    setSelectedDate(start.toISOString().split("T")[0]);
    setSelectedSlot(start.toISOString());
    setSuccess("");
    setError("");
  };

  const handleSlotSelect = (slot: SlotInfo) => {
    // Obrigar a selecionar serviço primeiro
    if (!selectedService) {
      setError("Por favor, selecione primeiro um serviço.");
      return;
    }

    const earliest = new Date();
    earliest.setHours(0, 0, 0, 0);
    earliest.setDate(earliest.getDate() + 1);

    if (slot.start < earliest) {
      setError("Escolha um horário a partir de amanhã.");
      return;
    }

    const service = services.find((s) => s.id === selectedService);
    if (!service) return;

    // Usar sempre a duração do serviço selecionado
    const duration = service.durationMin;
    updateDraftEvent(slot.start, duration);
    setDraftEvent((prev) =>
      prev
        ? {
            ...prev,
            title: service.name,
            status: "PENDING",
            durationMin: duration,
          }
        : null
    );
  };

  const handleDraftMove = ({
    event,
    start,
  }: {
    event: CalendarEvent;
    start: string | Date;
    end: string | Date;
  }) => {
    if (!event.isDraft) return;

    const startDate = typeof start === "string" ? new Date(start) : start;

    const earliest = new Date();
    earliest.setHours(0, 0, 0, 0);
    earliest.setDate(earliest.getDate() + 1);

    if (startDate < earliest) {
      setError("Escolha um horário a partir de amanhã.");
      return;
    }

    // Manter sempre a duração fixa do serviço (não permitir redimensionar)
    const service = services.find((s) => s.id === selectedService);
    const duration = service?.durationMin || event.durationMin || 30;
    updateDraftEvent(startDate, duration);
  };

  const businessDayStart = useMemo(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  }, []);

  const businessDayEnd = useMemo(() => {
    const date = new Date();
    date.setHours(21, 0, 0, 0);
    return date;
  }, []);

  // Verificar se pode navegar para trás (não permitir ir antes de hoje)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const canGoBack = useMemo(() => {
    const prevWeek = addWeeks(calendarDate, -1);
    const endOfPrevWeek = addWeeks(prevWeek, 1);
    return endOfPrevWeek >= today;
  }, [calendarDate, today]);

  const handleNavigate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < today) {
      setCalendarDate(today);
    } else {
      setCalendarDate(date);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  // Se email não verificado, mostrar aviso
  if (emailNotVerified) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Não Verificado</h1>
          <p className="text-gray-600 mb-6">
            Para fazer marcações, precisa primeiro de verificar o seu email.
            Verifique a sua caixa de entrada e clique no link de confirmação.
          </p>
          {user && (
            <p className="text-sm text-gray-500 mb-4">
              Email: <strong>{user.email}</strong>
            </p>
          )}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Ir para Dashboard
            </Link>
            <p className="text-sm text-gray-500">
              Não recebeu o email? Use o botão na barra de navegação para reenviar.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Obter próxima data mínima (amanhã)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-100 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-green-700">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Marcações</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Minhas Marcações</h1>
          <p className="text-gray-600">Gerir e criar novas marcações</p>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Criar Nova Marcação */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Marcação</h2>

            {/* Formulário compacto */}
            <form onSubmit={handleCreateBooking} className="space-y-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selecionar Serviço */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Serviço *
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => {
                      setSelectedService(e.target.value);
                      setDraftEvent(null);
                      setSelectedSlot("");
                      setError("");
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.durationMin}min - €{(service.priceCents / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selecionar Data */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Data *
                  </label>
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    minDate={minDate}
                    placeholder="Selecionar data"
                  />
                </div>
              </div>

              {/* Selecionar Horário */}
              {selectedService && selectedDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Horário Disponível *
                  </label>
                  {loadingSlots ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      A carregar horários...
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto">
                      {availableSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const selectedStart = new Date(slot.startAt);
                            const service = services.find((s) => s.id === selectedService);
                            const duration = service?.durationMin || 30;
                            setSelectedSlot(slot.startAt);
                            setSelectedDate(slot.startAt.split("T")[0]);
                            setDraftEvent({
                              id: "draft",
                              title: service ? service.name : "Nova marcação",
                              start: selectedStart,
                              end: addMinutes(selectedStart, duration),
                              isDraft: true,
                              durationMin: duration,
                            });
                          }}
                          className={`px-2 py-1.5 rounded-lg border text-sm font-medium transition ${
                            selectedSlot === slot.startAt
                              ? "bg-green-700 text-white border-green-700"
                              : "bg-white border-gray-300 text-gray-700 hover:border-green-500"
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
                      Nenhum horário disponível
                    </div>
                  )}
                </div>
              )}

              {/* Notas e Botão */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Informações adicionais..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || (!selectedSlot && !draftEvent)}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "A criar..." : "Criar Marcação"}
                </button>
              </div>
            </form>

            {/* Calendário com altura reduzida e scroll */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Calendário</p>
                  <p className="text-xs text-gray-500">
                    {selectedService
                      ? "Clique para escolher horário ou arraste o bloco"
                      : "Selecione primeiro um serviço"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => canGoBack && setCalendarDate(addWeeks(calendarDate, -1))}
                    disabled={!canGoBack}
                    className={`px-2 py-1 rounded border ${
                      canGoBack
                        ? "border-gray-300 bg-white hover:border-green-500"
                        : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarDate(new Date())}
                    className="px-2 py-1 rounded border border-gray-300 bg-white hover:border-green-500"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarDate(addWeeks(calendarDate, 1))}
                    className="px-2 py-1 rounded border border-gray-300 bg-white hover:border-green-500"
                  >
                    Próxima →
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <DragAndDropCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  defaultView="week"
                  date={calendarDate}
                  views={["week", "day"]}
                  step={30}
                  timeslots={2}
                  selectable={!!selectedService}
                  resizable={false}
                  popup
                  style={{ height: 480 }}
                  onSelectSlot={handleSlotSelect}
                  onEventDrop={handleDraftMove}
                  onNavigate={handleNavigate}
                  eventPropGetter={eventPropGetter}
                  draggableAccessor={(event) => !!event.isDraft}
                  min={businessDayStart}
                  max={businessDayEnd}
                  culture="pt-PT"
                  formats={{
                    weekdayFormat: (date: Date) => format(date, "EEE", { locale: pt }),
                    dayFormat: (date: Date) => format(date, "d EEE", { locale: pt }),
                    dayHeaderFormat: (date: Date) => format(date, "EEEE, d MMMM", { locale: pt }),
                    monthHeaderFormat: (date: Date) => format(date, "MMMM yyyy", { locale: pt }),
                    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                      `${format(start, "d", { locale: pt })} - ${format(end, "d MMMM yyyy", { locale: pt })}`,
                  }}
                  messages={{
                    week: "Semana",
                    day: "Dia",
                    previous: "Anterior",
                    next: "Seguinte",
                    today: "Hoje",
                    month: "Mês",
                  }}
                />
              </div>

              {/* Info do horário selecionado */}
              {draftEvent && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {format(draftEvent.start, "EEEE, dd MMMM", { locale: pt })}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {format(draftEvent.start, "HH:mm")} • {draftEvent.durationMin || differenceInMinutes(draftEvent.end, draftEvent.start)} min
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftEvent(null);
                        setSelectedSlot("");
                        setSelectedDate("");
                      }}
                      className="text-red-600 hover:text-red-700 text-xs font-semibold"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Minhas Marcações */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setFilterPeriod("future")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                  filterPeriod === "future"
                    ? "text-green-700 border-b-2 border-green-700 bg-green-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Próximas
                </span>
              </button>
              <button
                onClick={() => setFilterPeriod("history")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                  filterPeriod === "history"
                    ? "text-green-700 border-b-2 border-green-700 bg-green-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Histórico
                </span>
              </button>
            </div>

            <div className="p-6">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">
                    {filterPeriod === "future"
                      ? "Não tem marcações agendadas"
                      : "Ainda não tem histórico de marcações"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredBookings.map((booking) => {
                  const startDate = new Date(booking.startAt);
                  const isPast = startDate < new Date();

                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {booking.service.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Código: {booking.code}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {startDate.toLocaleDateString("pt-PT", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            {startDate.toLocaleTimeString("pt-PT", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            - {booking.service.durationMin}min
                          </span>
                        </div>
                        {booking.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs italic">
                            {booking.notes}
                          </div>
                        )}
                      </div>

                      {/* Botões de adicionar ao calendário - só para confirmadas e futuras */}
                      {!isPast && booking.status === "CONFIRMED" && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-green-700 mb-2 font-semibold flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Adicionar ao Calendário
                          </p>
                          <div className="flex gap-2">
                            <a
                              href={generateGoogleCalendarUrl(booking)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 bg-green-50 border-2 border-green-200 text-green-700 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-100 hover:border-green-400 transition shadow-sm"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm1-8h4v2h-6V7h2v5z"/>
                              </svg>
                              Google
                            </a>
                            <button
                              onClick={() => downloadIcsFile(booking)}
                              className="flex-1 flex items-center justify-center gap-2 bg-blue-50 border-2 border-blue-200 text-blue-700 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-100 hover:border-blue-400 transition shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              iCal/Outlook
                            </button>
                          </div>
                        </div>
                      )}

                      {!isPast && booking.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className={`${booking.status === "CONFIRMED" ? "mt-3" : "mt-4"} w-full text-red-600 hover:text-red-700 text-sm font-semibold`}
                        >
                          Cancelar Marcação
                        </button>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MarcacoesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        </div>
      }
    >
      <MarcacoesContent />
    </Suspense>
  );
}
