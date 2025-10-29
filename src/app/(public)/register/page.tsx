"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (formData.password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As palavras-passe não coincidem");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
        }),
      });

      if (res.ok) {
        // Redirecionar para login após sucesso
        router.push("/auth/login?registered=true");
      } else {
        const err = await res.json();
        setError(err.error || "Erro ao criar conta");
      }
    } catch (err) {
      console.error("Erro no registo:", err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-800 mb-2 text-center">
          Criar Conta
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Preencha os seus dados para se registar
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-8 space-y-4"
        >
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="+351 XXX XXX XXX"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Palavra-passe *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md p-2"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Confirmar Palavra-passe *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 px-4 rounded-md text-white transition-colors ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {loading ? "A criar conta..." : "Criar Conta"}
          </button>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Já tem conta?{" "}
              <Link
                href="/auth/login"
                className="text-green-700 font-semibold hover:text-green-800"
              >
                Faça login aqui
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
