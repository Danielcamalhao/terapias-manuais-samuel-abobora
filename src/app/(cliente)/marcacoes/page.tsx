"use client";

import { useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  SlotInfo,
  Event,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMinutes,
} from "date-fns";
import { pt } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { mockServicos } from "@/data/mockServicos";

// Localização PT
const locales = { pt };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Mock inicial
const eventosMock = [
  {
    title: "Osteopatia - João",
    start: new Date(2025, 9, 23, 10, 0),
    end: new Date(2025, 9, 23, 11, 0),
  },
  {
    title: "Massagem Desportiva - Ana",
    start: new Date(2025, 9, 24, 15, 0),
    end: new Date(2025, 9, 24, 15, 45),
  },
];

export default function MarcacoesPage() {
  const [eventos, setEventos] = useState<Event[]>(eventosMock);
  const [servicoSelecionado, setServicoSelecionado] = useState<string>("");

  // Função chamada ao clicar num horário livre
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (!servicoSelecionado) {
      alert("⚠️ Selecione primeiro um serviço!");
      return;
    }

    const servico = mockServicos.find(
      (s) => s.nome === servicoSelecionado
    );

    if (!servico) return;

    // Calcula hora de fim com base na duração do serviço
    const start = slotInfo.start;
    const end = addMinutes(start, servico.duracao);

    // Verifica sobreposição
    const sobreposto = eventos.some(
      (e) =>
        e.start && e.end &&
        ((start >= e.start && start < e.end) ||
        (end > e.start && end <= e.end))
    );

    if (sobreposto) {
      alert("⚠️ Esse horário já está ocupado!");
      return;
    }

    const nomeCliente = prompt("Nome do cliente:");
    if (nomeCliente) {
      const novoEvento = {
        title: `${servico.nome} - ${nomeCliente}`,
        start,
        end,
      };
      setEventos([...eventos, novoEvento]);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-[#178A3A] mb-4 text-center">
          Agenda Semanal
        </h1>

        {/* SELECTOR DE SERVIÇO */}
        <div className="mb-6 text-center">
          <label
            htmlFor="servico"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Escolha o serviço:
          </label>
          <select
            id="servico"
            value={servicoSelecionado}
            onChange={(e) => setServicoSelecionado(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#178A3A]"
          >
            <option value="">Selecione um serviço</option>
            {mockServicos.map((servico) => (
              <option key={servico.id} value={servico.nome}>
                {servico.nome} — {servico.duracao} min
              </option>
            ))}
          </select>
        </div>

        {/* CALENDÁRIO */}
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          defaultView="week"
          views={["week", "day", "agenda"]}
          onSelectSlot={handleSelectSlot}
          step={15}
          timeslots={4}
          min={new Date(2025, 9, 23, 9, 0)} // abre às 9h
          max={new Date(2025, 9, 23, 18, 0)} // fecha às 18h
          messages={{
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            today: "Hoje",
            previous: "←",
            next: "→",
          }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "#178A3A",
              borderRadius: "6px",
              color: "white",
              border: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            },
          })}
        />
      </div>
    </main>
  );
}
