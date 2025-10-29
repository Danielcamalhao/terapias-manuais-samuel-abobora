"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    if (!selectedSlot || !selectedUser) {
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
          startAt: selectedSlot,
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
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    required
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
                  disabled={creating || !selectedSlot}
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
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
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
