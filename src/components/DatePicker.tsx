"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function DatePicker({
  value,
  onChange,
  placeholder = "Selecionar data",
  minDate,
  maxDate,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const containerRef = useRef<HTMLDivElement>(null);
  const yearsContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar com o mês da data selecionada
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value + "T00:00:00"));
    }
  }, [value]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode("days");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Dias vazios no início
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = selectedDate.toISOString().split("T")[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = date.toISOString().split("T")[0];

    if (minDate && dateString < minDate) return true;
    if (maxDate && dateString > maxDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(value + "T00:00:00");
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input de display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-left flex items-center justify-between"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Calendário dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
          {/* Header do calendário */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") handlePrevMonth();
                else if (viewMode === "months") setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
                else if (viewMode === "years") setCurrentMonth(new Date(currentMonth.getFullYear() - 12, currentMonth.getMonth(), 1));
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Botão para alternar entre views */}
            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") setViewMode("months");
                else if (viewMode === "months") setViewMode("years");
                else setViewMode("days");
              }}
              className="font-semibold text-gray-900 hover:bg-green-50 hover:text-green-700 px-3 py-1 rounded-lg transition"
            >
              {viewMode === "years"
                ? `${currentMonth.getFullYear() - 11} - ${currentMonth.getFullYear()}`
                : viewMode === "months"
                ? currentMonth.getFullYear()
                : `${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
              }
            </button>

            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") handleNextMonth();
                else if (viewMode === "months") setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
                else if (viewMode === "years") setCurrentMonth(new Date(currentMonth.getFullYear() + 12, currentMonth.getMonth(), 1));
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Vista de Anos */}
          {viewMode === "years" && (
            <div className="grid grid-cols-4 gap-2" ref={yearsContainerRef}>
              {(() => {
                const baseYear = currentMonth.getFullYear();
                const startYear = baseYear - 11;
                const years = [];
                for (let y = startYear; y <= baseYear; y++) {
                  years.push(y);
                }
                return years.map((displayYear) => (
                  <button
                    key={displayYear}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(new Date(displayYear, currentMonth.getMonth(), 1));
                      setViewMode("months");
                    }}
                    className={`py-2 px-1 text-sm rounded-lg transition ${
                      displayYear === currentMonth.getFullYear()
                        ? "bg-green-600 text-white font-semibold"
                        : displayYear === new Date().getFullYear()
                        ? "bg-green-100 text-green-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {displayYear}
                  </button>
                ));
              })()}
            </div>
          )}

          {/* Vista de Meses */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_SHORT.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(new Date(currentMonth.getFullYear(), index, 1));
                    setViewMode("days");
                  }}
                  className={`py-2 px-1 text-sm rounded-lg transition ${
                    index === currentMonth.getMonth() && currentMonth.getFullYear() === new Date().getFullYear()
                      ? "bg-green-100 text-green-700 font-semibold"
                      : index === currentMonth.getMonth()
                      ? "bg-green-600 text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          )}

          {/* Vista de Dias */}
          {viewMode === "days" && (
            <>
              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day !== null ? (
                      <button
                        type="button"
                        onClick={() => !isDateDisabled(day) && handleSelectDay(day)}
                        disabled={isDateDisabled(day)}
                        className={`w-full h-full flex items-center justify-center text-sm rounded-lg transition
                          ${isSelected(day)
                            ? "bg-green-600 text-white font-semibold"
                            : isToday(day)
                            ? "bg-green-100 text-green-700 font-semibold"
                            : isDateDisabled(day)
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        {day}
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Botão limpar */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Limpar data
            </button>
          )}
        </div>
      )}
    </div>
  );
}
