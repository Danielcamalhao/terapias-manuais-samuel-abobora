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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/contacts", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setContacts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/admin/contacts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
      setLoading(false);
    };
    fetchData();
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

  const openWhatsApp = (phone: string, name: string) => {
    // Limpar o número de telefone (remover espaços, hífens, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    // Adicionar código de país se não tiver
    const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone.startsWith("351") ? cleanPhone : `351${cleanPhone}`;
    const message = encodeURIComponent(`Olá ${name}, obrigado por entrar em contacto connosco!`);
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
  };

  const openEmail = (email: string, name: string) => {
    const subject = encodeURIComponent("Re: Contacto - Terapias Manuais Samuel Abóbora");
    const body = encodeURIComponent(`Olá ${name},\n\nObrigado por entrar em contacto connosco.\n\n`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  };

  const openGmail = (email: string, name: string) => {
    const subject = encodeURIComponent("Re: Contacto - Terapias Manuais Samuel Abóbora");
    const body = encodeURIComponent(`Olá ${name},\n\nObrigado por entrar em contacto connosco.\n\n`);
    window.open(`https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}&body=${body}`, "_blank");
  };

  const openOutlook = (email: string, name: string) => {
    const subject = encodeURIComponent("Re: Contacto - Terapias Manuais Samuel Abóbora");
    const body = encodeURIComponent(`Olá ${name},\n\nObrigado por entrar em contacto connosco.\n\n`);
    window.open(`https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${subject}&body=${body}`, "_blank");
  };

  const unreadCount = contacts.filter((c) => !c.read).length;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contactos</h1>
              <p className="text-gray-600">
                Mensagens recebidas através do formulário de contacto do site.
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-sm">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
              <p className="text-gray-600 mt-4">A carregar mensagens...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-500">Nenhuma mensagem recebida.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className={`p-5 transition ${!c.read ? "bg-green-50/60" : "hover:bg-gray-50"}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                      !c.read ? "bg-green-600" : "bg-gray-400"
                    }`}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{c.name}</h3>
                        {!c.read && (
                          <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                            Nova
                          </span>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(c.createdAt).toLocaleString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Contactos do cliente */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {c.email}
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {c.phone}
                          </span>
                        )}
                      </div>

                      {/* Mensagem */}
                      <div
                        className={`text-gray-700 bg-gray-50 rounded-lg p-3 ${
                          expandedId === c.id ? "" : "line-clamp-2"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{c.message}</p>
                      </div>
                      {c.message.length > 150 && (
                        <button
                          onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                          className="text-sm text-green-700 hover:text-green-800 mt-1"
                        >
                          {expandedId === c.id ? "Ver menos" : "Ver mais"}
                        </button>
                      )}

                      {/* Ações */}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {/* Botões de email */}
                        <button
                          onClick={() => openEmail(c.email, c.name)}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                          title="Abrir no Apple Mail (macOS/iOS)"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                          Mail
                        </button>

                        <button
                          onClick={() => openGmail(c.email, c.name)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                          title="Abrir no Gmail"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                          </svg>
                          Gmail
                        </button>

                        <button
                          onClick={() => openOutlook(c.email, c.name)}
                          className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg text-sm font-medium hover:bg-sky-100 transition"
                          title="Abrir no Outlook"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.229-.58.229h-8.547v-6.959l1.6 1.229c.102.075.249.112.442.112.192 0 .34-.037.441-.112l6.882-5.334v-.219zm-9.365-1.498v5.801l-2.635 2.042L0 5.443v-.018l.022-.04c.063-.163.15-.298.261-.405.11-.107.245-.179.405-.216.161-.037.338-.037.533 0l11.414 1.125zm0 6.723v5.5H.764c-.228 0-.42-.075-.577-.224C.078 17.738 0 17.545 0 17.316V6.312l12 9.3h2.635zm.947-6.723l9.365-1.125c.227-.029.422.006.586.106.163.1.278.24.345.418l.022.04v.018l-7.683 5.934-2.635-2.042V5.889z"/>
                          </svg>
                          Outlook
                        </button>

                        {c.phone && (
                          <button
                            onClick={() => openWhatsApp(c.phone!, c.name)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </button>
                        )}

                        <div className="flex-1"></div>

                        {/* Ações de gestão */}
                        <button
                          onClick={() => toggleRead(c.id, c.read)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                            c.read
                              ? "text-gray-600 hover:bg-gray-100"
                              : "text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {c.read ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                              </svg>
                              Marcar não lida
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Marcar lida
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onDelete(c.id)}
                          className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
