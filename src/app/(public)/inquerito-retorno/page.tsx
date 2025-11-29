"use client";

import { useState } from "react";

const reasons = [
  "Preço",
  "Localização",
  "Disponibilidade de horários",
  "Experiência com o terapeuta",
  "Resultados não corresponderam",
  "Questões pessoais/tempo",
  "Outro",
];

export default function InqueritoRetornoPage() {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setMessage("Escolha uma opção.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Inquérito de retorno",
          email: "inquerito@cliente",
          phone: "",
          message: `INQUERITO RETORNO | Motivo: ${selectedReason} | Detalhes: ${details || "n/a"}`,
        }),
      });
      setStatus("sent");
      setMessage("Obrigado por responder! Aqui está o seu cupão: VOLTE10");
    } catch (err) {
      setStatus("error");
      setMessage("Ocorreu um erro ao enviar. Tente novamente.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/10 to-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-white/60 p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Por que deixou de visitar?
            </h1>
            <p className="text-gray-600">
              A sua resposta é anónima e ajuda-nos a melhorar. No fim, recebe um cupão de
              agradecimento.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reasons.map((reason) => (
                <label
                  key={reason}
                  className={`border rounded-xl px-4 py-3 cursor-pointer transition ${
                    selectedReason === reason
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    className="hidden"
                    onChange={() => setSelectedReason(reason)}
                    checked={selectedReason === reason}
                  />
                  <span className="font-semibold text-gray-900">{reason}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quer partilhar mais detalhes? (opcional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Escreva aqui..."
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-green-700 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60"
            >
              {status === "sending" ? "A enviar..." : "Enviar e receber cupão"}
            </button>
          </form>

          {message && (
            <div
              className={`text-sm rounded-lg px-4 py-3 ${
                status === "sent"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-yellow-50 text-yellow-800 border border-yellow-200"
              }`}
            >
              {message}
              {status === "sent" && (
                <div className="mt-2">
                  <span className="font-semibold text-green-800">Cupão: </span>
                  <span className="font-mono text-green-900">VOLTE10</span>
                  <p className="text-xs text-gray-600">
                    Use na próxima sessão. Cupão único por cliente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
