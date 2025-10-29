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

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/contacts", { cache: "no-store" });
    if (res.ok) setContacts(await res.json());
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

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Mensagens Recebidas</h2>

      {loading ? (
        <p>A carregar...</p>
      ) : contacts.length === 0 ? (
        <p className="text-gray-500">Nenhuma mensagem recebida.</p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
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
                <tr key={c.id} className={`border-t ${!c.read ? "bg-green-50" : ""}`}>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.phone || "-"}</td>
                  <td className="p-3 max-w-xs truncate" title={c.message}>
                    {c.message}
                  </td>
                  <td className="p-3 text-gray-500">
                    {new Date(c.createdAt).toLocaleString("pt-PT")}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleRead(c.id, c.read)}
                      className={`mr-2 px-3 py-1 rounded border ${
                        c.read ? "text-gray-700" : "text-green-700"
                      }`}
                    >
                      {c.read ? "Marcar como não lida" : "Marcar como lida"}
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="px-3 py-1 rounded border text-red-600"
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
    </div>
  );
}
