"use client";

import { useState } from "react";

export default function ContactosPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("A enviar...");

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("✅ Mensagem enviada com sucesso!");
      setForm({ name: "", email: "", phone: "", message: "" });
    } else {
      setStatus("❌ Ocorreu um erro ao enviar. Tente novamente.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/10 to-white py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold text-gray-900">Contactos</h1>
          <p className="text-gray-600">
            Fale connosco para agendar, esclarecer dúvidas ou conhecer melhor as terapias.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="bg-white rounded-3xl shadow-lg border border-white/60 overflow-hidden">
            <div className="p-6 space-y-3">
              <p className="text-gray-800">
                📍 Avenida Capitão António Gomes Rocha nº18, 2745 Queluz, Monte Abraão
              </p>
              <p className="text-gray-800">📞 Telefone: +351 968 633 307</p>
              <p className="text-gray-800">✉️ Email: terapiasmanuaisabobora@gmail.com</p>
            </div>
            <div className="h-[420px]">
              <iframe
                title="Localização - Samuel Abóbora"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.321063516019!2d-9.2612733!3d38.7550984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1eced78b9f9b73%3A0xfeb06a1f81c9cc17!2sAv.%20Capit%C3%A3o%20Ant%C3%B3nio%20Gomes%20Rocha%2018%2C%202745-163%20Queluz!5e0!3m2!1spt-PT!2spt!4v1730202012345!5m2!1spt-PT!2spt&maptype=satellite"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-lg border border-white/60 p-6 space-y-4"
          >
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Envie-nos uma mensagem
              </h2>
              <p className="text-sm text-gray-600">Respondemos o mais rápido possível.</p>
            </div>

            <input
              name="name"
              type="text"
              placeholder="Nome"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <input
              name="phone"
              type="tel"
              placeholder="Telefone (opcional)"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <textarea
              name="message"
              placeholder="Mensagem"
              value={form.message}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 h-32 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            ></textarea>

            <button
              type="submit"
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl w-full font-semibold transition"
            >
              Enviar
            </button>

            {status && (
              <p className="text-center text-sm mt-2 text-gray-700">{status}</p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
