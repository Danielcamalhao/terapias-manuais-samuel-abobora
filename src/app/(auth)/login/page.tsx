"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Login fictício
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // credenciais mock
    if (username === "samuel" && password === "1234") {
      localStorage.setItem("user", JSON.stringify({ name: "Samuel Abóbora" }));
      router.push("/dashboard"); // redireciona após login
    } else {
      setError("Utilizador ou palavra-passe incorretos.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-3xl font-bold text-green-800 mb-6">
        Área de Cliente
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm"
      >
        <label className="block mb-3 text-sm font-semibold text-gray-700">
          Utilizador
        </label>
 <input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  className="w-full border rounded-md px-3 py-2 mb-4 text-gray-900 placeholder-gray-400"
  placeholder="Introduza o seu utilizador"
/>

<input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full border rounded-md px-3 py-2 mb-6 text-gray-900 placeholder-gray-400"
  placeholder="••••••••"
/>


        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-800 transition w-full"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
