"use client";

import { useEffect, useMemo, useState } from "react";
import DatePicker from "@/components/DatePicker";
import {
  Calendar,
  dateFnsLocalizer,
  type SlotInfo,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import {
  addMinutes,
  addWeeks,
  differenceInMinutes,
  format,
  getDay,
  parse,
  startOfWeek,
} from "date-fns";
import { pt } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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
  user: {
    name: string;
    email: string;
    phone: string | null;
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
  serviceName?: string;
  durationMin?: number;
  userName?: string;
  isDraft?: boolean;
};

const locales = { "pt-PT": pt, pt };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});
const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar);

export default function MarcacoesBackoffice() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Formulário
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [draftEvent, setDraftEvent] = useState<CalendarEvent | null>(null);
  const [movingBooking, setMovingBooking] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Filtros
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

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
      // Buscar marcações
      const bookingsRes = await fetch("/api/bookings");
      if (!bookingsRes.ok) throw new Error("Erro ao carregar marcações");
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);

      // Buscar serviços
      const servicesRes = await fetch("/api/services");
      if (!servicesRes.ok) throw new Error("Erro ao carregar serviços");
      const servicesData = await servicesRes.json();
      setServices(servicesData.filter((s: any) => s.active));

      // Buscar utilizadores
      const usersRes = await fetch("/api/admin/users");
      if (!usersRes.ok) throw new Error("Erro ao carregar utilizadores");
      const usersData = await usersRes.json();
      setUsers(usersData.filter((u: any) => u.role === "CLIENT"));
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
    if (!slotToUse || !selectedUser) {
      setError("Por favor preencha todos os campos obrigatórios");
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
          userId: selectedUser,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao criar marcação");
      }

      setSuccess("Marcação criada com sucesso!");
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao atualizar status");
      }

      setSuccess("Status atualizado com sucesso!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Tem certeza que deseja remover esta marcação?")) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao remover marcação");
      }

      setSuccess("Marcação removida com sucesso!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setSelectedUser("");
    setSelectedService("");
    setSelectedDate("");
    setSelectedSlot("");
    setNotes("");
    setDraftEvent(null);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pendente" },
      CONFIRMED: { bg: "bg-green-100", text: "text-green-700", label: "Confirmada" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Cancelada" },
      NO_SHOW: { bg: "bg-gray-100", text: "text-gray-700", label: "Faltou" },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Filtrar marcações
  const filteredBookings = bookings.filter((booking) => {
    if (filterStatus !== "ALL" && booking.status !== filterStatus) return false;
    if (filterDate) {
      const bookingDate = new Date(booking.startAt).toISOString().split("T")[0];
      if (bookingDate !== filterDate) return false;
    }
    return true;
  });

  const calendarEvents = useMemo(() => {
    const baseEvents: CalendarEvent[] = bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.service.name} · ${booking.user.name}`,
      start: new Date(booking.startAt),
      end: new Date(booking.endAt),
      status: booking.status,
      serviceName: booking.service.name,
      durationMin: booking.service.durationMin,
      userName: booking.user.name,
    }));

    return draftEvent ? [...baseEvents, draftEvent] : baseEvents;
  }, [bookings, draftEvent]);

  const eventPropGetter = (event: CalendarEvent) => {
    if (event.isDraft) {
      return {
        style: {
          backgroundColor: "rgba(22, 163, 74, 0.15)",
          color: "#0f172a",
          border: "1px dashed #16a34a",
          borderRadius: "12px",
        },
      };
    }

    const colors: Record<string, string> = {
      CONFIRMED: "#16a34a",
      PENDING: "#f59e0b",
      CANCELLED: "#9ca3af",
      NO_SHOW: "#ef4444",
    };

    const background = colors[event.status || "PENDING"] || "#16a34a";

    return {
      style: {
        backgroundColor: background,
        color: "#fff",
        border: "1px solid rgba(0,0,0,0.05)",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      },
    };
  };

  const handleSlotSelect = (slot: SlotInfo) => {
    const service = services.find((s) => s.id === selectedService);
    const selectionMinutes = Math.max(
      differenceInMinutes(slot.end ?? slot.start, slot.start),
      30
    );
    const duration = service?.durationMin || selectionMinutes;
    const end = addMinutes(slot.start, duration);

    setDraftEvent({
      id: "draft",
      title: service ? `Nova · ${service.name}` : "Nova marcação",
      start: slot.start,
      end,
      isDraft: true,
      serviceName: service?.name,
      durationMin: duration,
    });
    setSelectedDate(slot.start.toISOString().split("T")[0]);
    setSelectedSlot(slot.start.toISOString());
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const updateEventPosition = (event: CalendarEvent, start: Date, end?: Date) => {
    const baseDuration =
      event.durationMin ||
      Math.max(differenceInMinutes(event.end, event.start), 30);
    const durationMinutes = end
      ? Math.max(differenceInMinutes(end, start), 15)
      : baseDuration;
    const newEnd = addMinutes(start, durationMinutes);

    if (event.isDraft) {
      setDraftEvent({ ...event, start, end: newEnd, durationMin: durationMinutes });
      setSelectedDate(start.toISOString().split("T")[0]);
      setSelectedSlot(start.toISOString());
      return true;
    }

    return false;
  };

  const handleEventDrop = async ({
    event,
    start,
  }: {
    event: CalendarEvent;
    start: string | Date;
  }) => {
    const startDate = typeof start === "string" ? new Date(start) : start;
    if (updateEventPosition(event, startDate)) return;

    setMovingBooking(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/bookings/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: startDate.toISOString() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao mover marcação");
      }

      setSuccess("Horário atualizado no calendário");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMovingBooking(false);
    }
  };

  const handleEventResize = async ({
    event,
    start,
    end,
  }: {
    event: CalendarEvent;
    start: string | Date;
    end: string | Date;
  }) => {
    const startDate = typeof start === "string" ? new Date(start) : start;
    const endDate = typeof end === "string" ? new Date(end) : end;
    if (updateEventPosition(event, startDate, endDate)) return;

    setMovingBooking(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/bookings/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: startDate.toISOString() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao redimensionar marcação");
      }

      setSuccess("Horário atualizado no calendário");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMovingBooking(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">
              Gestão de Marcações
            </h1>
            <p className="text-gray-600">
              Total de marcações: {bookings.length}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
          >
            {showForm ? "Fechar" : "Nova Marcação"}
          </button>
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

        {/* Calendário interativo */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Calendário semanal
              </h2>
              <p className="text-gray-600">
                Arraste para criar um horário, ajuste o bloco ou mova marcações existentes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-600"></span> Confirmada
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pendente
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-full">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span> Cancelada
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Faltou
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="text-sm font-semibold text-gray-800">Navegar semanas</div>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setCalendarDate(addWeeks(calendarDate, -1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:border-green-500"
                  >
                    ← Semana anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarDate(new Date())}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:border-green-500"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarDate(addWeeks(calendarDate, 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:border-green-500"
                  >
                    Próxima semana →
                  </button>
                </div>
              </div>
              <DragAndDropCalendar
                localizer={localizer}
                events={calendarEvents}
                defaultView="week"
                date={calendarDate}
                views={["week", "day"]}
                step={30}
                timeslots={2}
                selectable
                resizable
                popup
                style={{ height: 580 }}
                onSelectSlot={handleSlotSelect}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                onNavigate={(date) => setCalendarDate(date)}
                eventPropGetter={eventPropGetter}
                draggableAccessor={() => true}
                tooltipAccessor={(event) =>
                  `${event.serviceName || ""}${event.userName ? ` · ${event.userName}` : ""}`
                }
                min={businessDayStart}
                max={businessDayEnd}
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

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Criar/ajustar via calendário</h3>
              {draftEvent ? (
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Horário selecionado</span>
                      <button
                        onClick={() => {
                          setDraftEvent(null);
                          setSelectedSlot("");
                          setSelectedDate("");
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Limpar
                      </button>
                    </div>
                  <p>
                    {format(draftEvent.start, "EEEE, dd MMMM", { locale: pt })} às{" "}
                    {format(draftEvent.start, "HH:mm")} (
                    {draftEvent.durationMin || differenceInMinutes(draftEvent.end, draftEvent.start)}{" "}
                    min)
                  </p>
                  <p className="text-gray-600">
                    Ajuste o bloco no calendário para aumentar/diminuir ou mover para outro dia.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50"
                    disabled={!selectedService || !selectedUser}
                  >
                    Usar horário no formulário
                  </button>
                  {!selectedService && (
                    <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      Selecione um serviço para aplicar a duração correta.
                    </p>
                  )}
                  {!selectedUser && (
                    <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      Selecione o cliente antes de gravar a marcação.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Selecione um bloco de tempo no calendário (pode arrastar e redimensionar) para
                  preencher automaticamente o formulário de nova marcação.
                </p>
              )}
              {movingBooking && (
                <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-2">
                  A atualizar marcação...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulário de Nova Marcação */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Nova Marcação (Admin)
            </h2>

            <form onSubmit={handleCreateBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Selecionar Cliente */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selecionar Serviço */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Serviço *
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.durationMin}min - €
                        {(service.priceCents / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selecionar Data */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data *
                  </label>
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    placeholder="Selecionar data"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>
              </div>

              {/* Horários Disponíveis */}
              {selectedService && selectedDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Horário *
                  </label>
                  {loadingSlots ? (
                    <div className="text-center py-8">A carregar...</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {availableSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot.startAt)}
                          className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                            selectedSlot === slot.startAt
                              ? "bg-green-700 text-white border-green-700"
                              : "bg-white border-gray-300 hover:border-green-500"
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                      Sem horários disponíveis
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={creating || (!selectedSlot && !draftEvent)}
                  className="flex-1 bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50"
                >
                  {creating ? "A criar..." : "Criar Marcação"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filtrar por Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="CANCELLED">Cancelada</option>
                <option value="NO_SHOW">Faltou</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filtrar por Data
              </label>
              <DatePicker
                value={filterDate}
                onChange={setFilterDate}
                placeholder="Filtrar por data"
              />
            </div>
          </div>
        </div>

        {/* Lista de Marcações */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Nenhuma marcação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const startDate = new Date(booking.startAt);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {booking.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{booking.user.name}</div>
                            <div className="text-gray-500">{booking.user.email}</div>
                            {booking.user.phone && (
                              <div className="text-gray-500">{booking.user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{booking.service.name}</div>
                            <div className="text-gray-500">
                              {booking.service.durationMin}min - €
                              {(booking.service.priceCents / 100).toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div>{startDate.toLocaleDateString("pt-PT")}</div>
                            <div className="text-gray-500">
                              {startDate.toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={booking.status}
                            onChange={(e) =>
                              handleUpdateStatus(booking.id, e.target.value)
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="PENDING">Pendente</option>
                            <option value="CONFIRMED">Confirmada</option>
                            <option value="CANCELLED">Cancelada</option>
                            <option value="NO_SHOW">Faltou</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-700 font-semibold"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
