"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Conta criada com sucesso! Faça login para continuar.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();

        // Redirecionar conforme o role
        if (data.role === "ADMIN") {
          router.push("/dashboard-bo");
        } else {
          router.push("/dashboard");
        }
      } else {
        const err = await res.json();
        setError(err.error || "Falha no login.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Login</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm"
      >
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 mb-4"
          required
        />

        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Palavra-passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 mb-4"
          required
        />

        {success && (
          <p className="text-green-600 text-sm mb-4 text-center bg-green-50 p-2 rounded">
            {success}
          </p>
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center bg-red-50 p-2 rounded">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-semibold py-2 px-4 rounded-md text-white transition-colors ${
            loading
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-700 hover:bg-green-800"
          }`}
        >
          {loading ? "A autenticar..." : "Entrar"}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Ainda não tem conta?{" "}
            <a href="/register" className="text-green-700 font-semibold hover:text-green-800">
              Registe-se aqui
            </a>
          </p>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
