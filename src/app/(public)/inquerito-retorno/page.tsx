"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const improvementOptions = [
  { value: "horarios", label: "Horários disponíveis" },
  { value: "precos", label: "Preços" },
  { value: "localizacao", label: "Localização" },
  { value: "atendimento", label: "Atendimento" },
  { value: "resultados", label: "Resultados do tratamento" },
  { value: "comunicacao", label: "Comunicação" },
  { value: "outro", label: "Outro" },
];

export default function InqueritoRetornoPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [wantsPromotions, setWantsPromotions] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggleArea = (value: string) => {
    setSelectedAreas((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setMessage("Por favor, avalie a sua experiência (1-5 estrelas).");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          improvementAreas: selectedAreas,
          wantsPromotions,
          suggestions: suggestions.trim() || null,
          clientName: clientName.trim() || null,
          clientEmail: clientEmail.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao enviar");
      }

      setStatus("sent");
      setMessage("Obrigado pelo seu feedback! A sua opinião ajuda-nos a melhorar.");
    } catch {
      setStatus("error");
      setMessage("Ocorreu um erro ao enviar. Tente novamente.");
    }
  };

  if (status === "sent") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/10 to-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg border border-white/60 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-green-600 fill-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Obrigado pelo seu feedback!
            </h1>
            <p className="text-gray-600">
              A sua opinião é muito importante para nós e ajuda-nos a melhorar continuamente os nossos serviços.
            </p>
            <a
              href="/"
              className="inline-block mt-4 bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/10 to-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-white/60 p-8 space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              A sua opinião é importante
            </h1>
            <p className="text-gray-600">
              Ajude-nos a melhorar respondendo a algumas perguntas rápidas.
              A resposta é anónima, mas pode deixar o seu contacto se desejar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Pergunta 1: Rating */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900">
                Como avalia a sua experiência connosco?
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-500">
                  {rating === 1 && "Muito insatisfeito"}
                  {rating === 2 && "Insatisfeito"}
                  {rating === 3 && "Neutro"}
                  {rating === 4 && "Satisfeito"}
                  {rating === 5 && "Muito satisfeito"}
                </p>
              )}
            </div>

            {/* Pergunta 2: Áreas de melhoria */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900">
                O que podemos melhorar?
              </label>
              <p className="text-sm text-gray-500">Selecione todas as opções que se aplicam</p>
              <div className="grid grid-cols-2 gap-3">
                {improvementOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`border rounded-xl px-4 py-3 cursor-pointer transition flex items-center gap-3 ${
                      selectedAreas.includes(option.value)
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 bg-white hover:border-green-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAreas.includes(option.value)}
                      onChange={() => toggleArea(option.value)}
                      className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pergunta 3: Promoções */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900">
                Gostaria de receber informações sobre promoções?
              </label>
              <div className="flex gap-4">
                <label
                  className={`flex-1 border rounded-xl px-4 py-3 cursor-pointer transition text-center ${
                    wantsPromotions === true
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="promotions"
                    className="hidden"
                    onChange={() => setWantsPromotions(true)}
                    checked={wantsPromotions === true}
                  />
                  <span className="font-medium text-gray-900">Sim</span>
                </label>
                <label
                  className={`flex-1 border rounded-xl px-4 py-3 cursor-pointer transition text-center ${
                    wantsPromotions === false
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="promotions"
                    className="hidden"
                    onChange={() => setWantsPromotions(false)}
                    checked={wantsPromotions === false}
                  />
                  <span className="font-medium text-gray-900">Não</span>
                </label>
              </div>
            </div>

            {/* Pergunta 4: Sugestões */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900">
                Alguma sugestão adicional?
              </label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Partilhe connosco o que podemos fazer para melhorar a sua experiência... (opcional)"
              />
            </div>

            {/* Dados opcionais */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Se desejar que entremos em contacto, pode deixar os seus dados (opcional):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="O seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="O seu email"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`text-sm rounded-lg px-4 py-3 ${
                  status === "error"
                    ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-green-700 text-white px-4 py-4 rounded-xl font-semibold text-lg hover:bg-green-800 transition disabled:opacity-60"
            >
              {status === "sending" ? "A enviar..." : "Enviar feedback"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
