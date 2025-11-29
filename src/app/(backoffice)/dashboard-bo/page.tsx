"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  addressCity?: string | null;
};

type Service = {
  id: string;
  name: string;
};

type Booking = {
  id: string;
  userId: string;
  service: Service;
  startAt: string;
  status: string;
  notes?: string | null;
};

type InactiveClient = User & { lastVisit: Date | null };

export default function DashboardBackoffice() {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedInactive, setSelectedInactive] = useState<string[]>([]);
  const [surveySubject, setSurveySubject] = useState("Queremos ouvir a sua opinião");
  const [surveyMessage, setSurveyMessage] = useState(
    "Notámos que não voltou às nossas terapias há algum tempo. Pode responder a este breve inquérito? É rápido e agradecemos com um cupão para a próxima sessão: https://example.com/inquerito-retorno"
  );
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        setLoading(true);
        const [usersRes, servicesRes, bookingsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/services"),
          fetch("/api/bookings"),
        ]);

        if (!usersRes.ok) throw new Error("Erro ao carregar utilizadores");
        if (!servicesRes.ok) throw new Error("Erro ao carregar serviços");
        if (!bookingsRes.ok) throw new Error("Erro ao carregar marcações");

        setUsers(await usersRes.json());
        setServices(await servicesRes.json());
        setBookings(await bookingsRes.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const clients = useMemo(() => users.filter((u) => u.role === "CLIENT"), [users]);

  const serviceRanking = useMemo(() => {
    const counts: Record<string, { name: string; total: number }> = {};
    services.forEach((s) => {
      counts[s.id] = { name: s.name, total: 0 };
    });
    bookings.forEach((b) => {
      const current = counts[b.service.id] || { name: b.service.name, total: 0 };
      counts[b.service.id] = { ...current, total: current.total + 1 };
    });
    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [bookings, services]);

  const topClients = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; email: string; total: number; last: Date | null }
    >();

    bookings.forEach((b) => {
      const client = users.find((u) => u.id === b.userId);
      if (!client) return;
      const entry = map.get(b.userId) || {
        id: b.userId,
        name: client.name,
        email: client.email,
        total: 0,
        last: null,
      };
      const start = new Date(b.startAt);
      map.set(b.userId, {
        ...entry,
        total: entry.total + 1,
        last: entry.last && entry.last > start ? entry.last : start,
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [bookings, users]);

  const zonesRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach((c) => {
      if (!c.addressCity) return;
      const city = c.addressCity.trim();
      if (!city) return;
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([city, total]) => ({ city, total }))
      .sort((a, b) => b.total - a.total);
  }, [clients]);

  const promotionRanking = useMemo(() => {
    const promos: Record<string, number> = {};
    bookings.forEach((b) => {
      if (!b.notes) return;
      const text = b.notes.toLowerCase();
      if (
        text.includes("promo") ||
        text.includes("cup") ||
        text.includes("desconto") ||
        text.includes("oferta")
      ) {
        const tag =
          text.match(/promo[:\s-]*([a-z0-9-_]+)/i)?.[1]?.toUpperCase() ||
          text.slice(0, 30);
        promos[tag] = (promos[tag] || 0) + 1;
      }
    });
    return Object.entries(promos)
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total);
  }, [bookings]);

  const inactiveClients: InactiveClient[] = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const lastByUser: Record<string, Date> = {};
    bookings.forEach((b) => {
      const dt = new Date(b.startAt);
      if (!lastByUser[b.userId] || dt > lastByUser[b.userId]) {
        lastByUser[b.userId] = dt;
      }
    });

    return clients
      .map((c) => ({
        ...c,
        lastVisit: lastByUser[c.id] || null,
      }))
      .filter((c) => !c.lastVisit || c.lastVisit < cutoff)
      .sort((a, b) => {
        if (!a.lastVisit && b.lastVisit) return -1;
        if (!b.lastVisit && a.lastVisit) return 1;
        if (!a.lastVisit && !b.lastVisit) return 0;
        return (a.lastVisit?.getTime() || 0) - (b.lastVisit?.getTime() || 0);
      });
  }, [bookings, clients]);

  const toggleInactiveSelect = (id: string) => {
    setSelectedInactive((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleInactiveAll = () => {
    if (selectedInactive.length === inactiveClients.length) {
      setSelectedInactive([]);
    } else {
      setSelectedInactive(inactiveClients.map((c) => c.id));
    }
  };

  const sendSurvey = async () => {
    if (!surveySubject.trim() || !surveyMessage.trim()) {
      setStatusMsg("Preencha assunto e mensagem.");
      return;
    }

    setSending(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/admin/users/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: surveySubject,
          message: surveyMessage,
          userIds: selectedInactive,
          sendToAll: selectedInactive.length === 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao enviar inquérito");
      }

      const data = await res.json();
      setStatusMsg(`Inquérito enviado para ${data.sent} clientes.`);
      setSelectedInactive([]);
    } catch (err: any) {
      setStatusMsg(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-primary-700">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600">
            Indicadores principais e ações rápidas sobre clientes e promoções.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Clientes ativos</p>
            <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
            <p className="text-xs text-gray-500 mt-1">Base total de clientes</p>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Marcações totais</p>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
            <p className="text-xs text-gray-500 mt-1">Inclui todas as situações</p>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Serviços oferecidos</p>
            <p className="text-3xl font-bold text-gray-900">{services.length}</p>
            <p className="text-xs text-gray-500 mt-1">Para ranking e aderência</p>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Clientes inativos (90d+)</p>
            <p className="text-3xl font-bold text-gray-900">{inactiveClients.length}</p>
            <p className="text-xs text-gray-500 mt-1">Elegíveis para inquérito</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Ranking de serviços</h2>
              <span className="text-sm text-gray-500">por nº de marcações</span>
            </div>
            <div className="space-y-3">
              {serviceRanking.length === 0 ? (
                <p className="text-gray-500 text-sm">Sem dados de serviços.</p>
              ) : (
                serviceRanking.map((s, idx) => (
                  <div
                    key={`${s.name}-${idx}`}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">Serviço</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {s.total} marcações
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Top 10 clientes</h2>
              <span className="text-sm text-gray-500">por nº de visitas</span>
            </div>
            <div className="space-y-3">
              {topClients.length === 0 ? (
                <p className="text-gray-500 text-sm">Sem dados de clientes.</p>
              ) : (
                topClients.map((c, idx) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        {c.total} marcações
                      </p>
                      <p className="text-xs text-gray-500">
                        Última:{" "}
                        {c.last
                          ? new Date(c.last).toLocaleDateString("pt-PT")
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Ranking de zonas de origem
              </h2>
              <span className="text-sm text-gray-500">por nº de clientes</span>
            </div>
            <div className="space-y-2">
              {zonesRanking.length === 0 ? (
                <p className="text-gray-500 text-sm">Sem dados de cidade nos perfis.</p>
              ) : (
                zonesRanking.map((z) => (
                  <div
                    key={z.city}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <span className="font-semibold text-gray-900">{z.city}</span>
                    <span className="text-sm text-gray-700">{z.total} clientes</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Aderência a promoções
              </h2>
              <span className="text-sm text-gray-500">detetadas nas notas</span>
            </div>
            <div className="space-y-2">
              {promotionRanking.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Sem promoções identificadas nas notas das marcações.
                </p>
              ) : (
                promotionRanking.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <span className="font-semibold text-gray-900">{p.label}</span>
                    <span className="text-sm text-gray-700">{p.total} marcações</span>
                  </div>
                ))
              )}
              <p className="text-xs text-gray-500">
                Sugestão: reutilize promoções com mais aderência em campanhas periódicas.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Clientes que não voltaram</h2>
              <p className="text-sm text-gray-600">
                Última visita há mais de 90 dias ou nunca visitaram — selecione e envie um
                inquérito.
              </p>
            </div>
            {inactiveClients.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={
                    inactiveClients.length > 0 &&
                    selectedInactive.length === inactiveClients.length
                  }
                  onChange={toggleInactiveAll}
                />
                Selecionar todos
              </label>
            )}
          </div>

          {inactiveClients.length === 0 ? (
            <p className="text-gray-500 text-sm">Sem clientes inativos no período analisado.</p>
          ) : (
            <div className="overflow-x-auto border rounded-xl mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={
                          inactiveClients.length > 0 &&
                          selectedInactive.length === inactiveClients.length
                        }
                        onChange={toggleInactiveAll}
                      />
                    </th>
                    <th className="p-3 text-left">Cliente</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Cidade</th>
                    <th className="p-3 text-left">Última visita</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveClients.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedInactive.includes(c.id)}
                          onChange={() => toggleInactiveSelect(c.id)}
                        />
                      </td>
                      <td className="p-3 font-semibold text-gray-900">{c.name}</td>
                      <td className="p-3 text-gray-700">{c.email}</td>
                      <td className="p-3 text-gray-700">{c.addressCity || "—"}</td>
                      <td className="p-3 text-gray-600">
                        {c.lastVisit
                          ? new Date(c.lastVisit).toLocaleDateString("pt-PT")
                          : "Sem visitas"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="space-y-3">
              <input
                type="text"
                value={surveySubject}
                onChange={(e) => setSurveySubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Assunto do inquérito"
              />
              <textarea
                value={surveyMessage}
                onChange={(e) => setSurveyMessage(e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Mensagem para os clientes inativos"
              />
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={sendSurvey}
                disabled={sending}
                className="w-full bg-green-700 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60"
              >
                {sending ? "A enviar..." : "Enviar inquérito"}
              </button>
              {statusMsg && (
                <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  {statusMsg}
                </div>
              )}
              <p className="text-xs text-gray-500">
                O envio é simulado (registo em log). Integre um serviço de email/SMS para
                disparo real.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
