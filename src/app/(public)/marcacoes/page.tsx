"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function MarcacoesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Formulário de nova marcação
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

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
    if (!selectedSlot) {
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
          startAt: selectedSlot,
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
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pendente" },
      CONFIRMED: { bg: "bg-green-100", text: "text-green-700", label: "Confirmada" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Cancelada" },
      NO_SHOW: { bg: "bg-gray-100", text: "text-gray-700", label: "Não Compareceu" },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Criar Nova Marcação */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Marcação</h2>

            <form onSubmit={handleCreateBooking} className="space-y-6">
              {/* Selecionar Serviço */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Serviço *
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Selecionar Horário */}
              {selectedService && selectedDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Horário Disponível *
                  </label>
                  {loadingSlots ? (
                    <div className="text-center py-8 text-gray-500">
                      A carregar horários...
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {availableSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot.startAt)}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition ${
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
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      Nenhum horário disponível para esta data
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Informações adicionais..."
                />
              </div>

              <button
                type="submit"
                disabled={creating || !selectedSlot}
                className="w-full bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "A criar..." : "Criar Marcação"}
              </button>
            </form>
          </div>

          {/* Minhas Marcações */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Histórico de Marcações
            </h2>

            {myBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
                <p>Ainda não tem marcações</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {myBookings.map((booking) => {
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

                      {!isPast && booking.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="mt-4 w-full text-red-600 hover:text-red-700 text-sm font-semibold"
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
    </main>
  );
}
