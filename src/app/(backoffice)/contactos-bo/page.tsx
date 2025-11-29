"use client";

import { useEffect, useState } from "react";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function ContactosBoPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/contacts", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setContacts(data);
      setSelectedIds([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (id: string, current: boolean) => {
    await fetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: !current }),
    });
    load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Eliminar mensagem?")) return;
    await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    load();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c.id));
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      setStatusMsg("Preencha assunto e mensagem.");
      return;
    }

    setSending(true);
    setStatusMsg("");

    const sendToAll = selectedIds.length === contacts.length || selectedIds.length === 0;

    try {
      const res = await fetch("/api/admin/contacts/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
          contactIds: selectedIds,
          sendToAll,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao enviar mensagem");
      }

      const data = await res.json();
      setStatusMsg(`Mensagem enviada para ${data.sent} destinatários.`);
      setBroadcastMessage("");
      setBroadcastSubject("");
      setSelectedIds([]);
    } catch (err: any) {
      setStatusMsg(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Contactos</h1>
          <p className="text-gray-600">
            Veja mensagens recebidas e envie comunicações promocionais para os clientes.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
          <section className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Mensagens recebidas
                  </h2>
                  <p className="text-sm text-gray-600">
                    Seleciona as mensagens para enviar promoções.
                  </p>
                </div>
                {contacts.length > 0 && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === contacts.length}
                      onChange={toggleSelectAll}
                    />
                    Selecionar todos
                  </label>
                )}
              </div>
            </div>

            {loading ? (
              <p className="text-gray-600">A carregar...</p>
            ) : contacts.length === 0 ? (
              <p className="text-gray-500">Nenhuma mensagem recebida.</p>
            ) : (
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === contacts.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-3 text-left">Nome</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Telefone</th>
                      <th className="p-3 text-left">Mensagem</th>
                      <th className="p-3 text-left">Data</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr
                        key={c.id}
                        className={`border-t ${!c.read ? "bg-green-50/60" : "bg-white"}`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleSelect(c.id)}
                          />
                        </td>
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3">{c.email}</td>
                        <td className="p-3">{c.phone || "-"}</td>
                        <td className="p-3 max-w-sm">
                          <div className="text-gray-800 whitespace-pre-wrap">
                            {c.message}
                          </div>
                        </td>
                        <td className="p-3 text-gray-500">
                          {new Date(c.createdAt).toLocaleString("pt-PT")}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => toggleRead(c.id, c.read)}
                            className={`mr-2 px-3 py-1 rounded border text-xs ${
                              c.read
                                ? "text-gray-700 hover:border-gray-400"
                                : "text-green-700 hover:border-green-500"
                            }`}
                          >
                            {c.read ? "Marcar como não lida" : "Marcar como lida"}
                          </button>
                          <button
                            onClick={() => onDelete(c.id)}
                            className="px-3 py-1 rounded border text-xs text-red-600 hover:border-red-400"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Enviar promoção</h2>
              <p className="text-sm text-gray-600">
                Seleciona as mensagens (ou usa “Selecionar todos”) para definir o público-alvo.
              </p>
            </div>
            <input
              type="text"
              placeholder="Assunto"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <textarea
              placeholder="Mensagem promocional"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={sendBroadcast}
              disabled={sending}
              className="w-full bg-green-700 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60"
            >
              {sending ? "A enviar..." : "Enviar promoção"}
            </button>
            {statusMsg && <p className="text-sm text-gray-700">{statusMsg}</p>}
            <p className="text-xs text-gray-500">
              Nota: o envio é simulado; integre um serviço de email/SMS para entrega real.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
