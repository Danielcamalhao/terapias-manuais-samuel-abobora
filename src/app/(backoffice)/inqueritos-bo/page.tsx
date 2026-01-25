"use client";

import { useEffect, useState } from "react";
import { Star, Mail, Trash2, Eye, EyeOff, TrendingUp, TrendingDown, Minus } from "lucide-react";

type SurveyResponse = {
  id: string;
  clientName: string | null;
  clientEmail: string | null;
  rating: number;
  improvementAreas: string[];
  wantsPromotions: boolean | null;
  suggestions: string | null;
  read: boolean;
  createdAt: string;
};

const improvementLabels: Record<string, string> = {
  horarios: "Horários",
  precos: "Preços",
  localizacao: "Localização",
  atendimento: "Atendimento",
  resultados: "Resultados",
  comunicacao: "Comunicação",
  outro: "Outro",
};

export default function InqueritosBoPage() {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/surveys", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSurveys(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (id: string, current: boolean) => {
    await fetch(`/api/admin/surveys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: !current }),
    });
    load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Eliminar resposta do inquérito?")) return;
    await fetch(`/api/admin/surveys/${id}`, { method: "DELETE" });
    load();
  };

  const openEmail = (email: string, name: string) => {
    const subject = encodeURIComponent("Obrigado pelo seu feedback - Terapias Manuais");
    const body = encodeURIComponent(`Olá ${name || ""},\n\nObrigado por responder ao nosso inquérito de satisfação.\n\n`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  };

  // Estatísticas
  const unreadCount = surveys.filter((s) => !s.read).length;
  const avgRating = surveys.length > 0
    ? (surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length).toFixed(1)
    : "0";
  const wantsPromo = surveys.filter((s) => s.wantsPromotions === true).length;

  // Áreas mais mencionadas
  const areaCounts: Record<string, number> = {};
  surveys.forEach((s) => {
    s.improvementAreas.forEach((area) => {
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    });
  });
  const topAreas = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingIcon = (rating: number) => {
    if (rating >= 4) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (rating <= 2) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-yellow-600" />;
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inquéritos de Satisfação</h1>
              <p className="text-gray-600">
                Respostas dos clientes ao inquérito de feedback.
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-sm">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Link do inquérito */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 font-medium mb-2">Link do inquérito para enviar aos clientes:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm text-gray-700 border border-blue-200">
                {typeof window !== "undefined" ? `${window.location.origin}/inquerito-retorno` : "/inquerito-retorno"}
              </code>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/inquerito-retorno`;
                  navigator.clipboard.writeText(url);
                  alert("Link copiado!");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Copiar
              </button>
            </div>
          </div>
        </header>

        {/* Estatísticas */}
        {surveys.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total de Respostas</p>
              <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Avaliação Média</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Querem Promoções</p>
              <p className="text-2xl font-bold text-gray-900">{wantsPromo}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Áreas a Melhorar</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {topAreas.map(([area, count]) => (
                  <span
                    key={area}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {improvementLabels[area] || area} ({count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista de respostas */}
        <section className="bg-white rounded-2xl shadow border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
              <p className="text-gray-600 mt-4">A carregar respostas...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Ainda não há respostas ao inquérito.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {surveys.map((s) => (
                <div
                  key={s.id}
                  className={`p-5 transition ${!s.read ? "bg-green-50/60" : "hover:bg-gray-50"}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rating badge */}
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                        s.rating >= 4
                          ? "bg-green-100"
                          : s.rating <= 2
                          ? "bg-red-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      <span className="text-xl font-bold text-gray-900">{s.rating}</span>
                      {getRatingIcon(s.rating)}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {renderStars(s.rating)}
                          {!s.read && (
                            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                              Nova
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(s.createdAt).toLocaleString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Cliente */}
                      {(s.clientName || s.clientEmail) && (
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          {s.clientName && (
                            <span className="font-medium text-gray-900">{s.clientName}</span>
                          )}
                          {s.clientEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {s.clientEmail}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Áreas de melhoria */}
                      {s.improvementAreas.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Áreas a melhorar:</p>
                          <div className="flex flex-wrap gap-1">
                            {s.improvementAreas.map((area) => (
                              <span
                                key={area}
                                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                              >
                                {improvementLabels[area] || area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Promoções */}
                      {s.wantsPromotions !== null && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Quer receber promoções:</span>{" "}
                          <span className={s.wantsPromotions ? "text-green-600" : "text-gray-500"}>
                            {s.wantsPromotions ? "Sim" : "Não"}
                          </span>
                        </p>
                      )}

                      {/* Sugestões */}
                      {s.suggestions && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          <p className="text-xs text-gray-500 mb-1">Sugestões:</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{s.suggestions}</p>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center gap-2 mt-4">
                        {s.clientEmail && (
                          <button
                            onClick={() => openEmail(s.clientEmail!, s.clientName || "")}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                          >
                            <Mail className="w-4 h-4" />
                            Responder
                          </button>
                        )}

                        <div className="flex-1"></div>

                        <button
                          onClick={() => toggleRead(s.id, s.read)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                            s.read
                              ? "text-gray-600 hover:bg-gray-100"
                              : "text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {s.read ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Marcar não lida
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Marcar lida
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onDelete(s.id)}
                          className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                        >
                          <Trash2 className="w-4 h-4" />
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
