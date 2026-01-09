"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link de verificação inválido.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            router.push("/auth/login?verified=true");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Erro ao verificar email");
        }
      } catch {
        setStatus("error");
        setMessage("Erro de conexão. Tente novamente.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-700 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              A verificar email...
            </h1>
            <p className="text-gray-600">Por favor aguarde.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              Email Verificado!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">
              Será redirecionado para o login em 3 segundos...
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Ir para Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">
              Erro na Verificação
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
              >
                Ir para Login
              </Link>
              <p className="text-sm text-gray-500">
                Se o link expirou, faça login e solicite um novo email de verificação.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-20">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-700 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">A carregar...</h1>
          </div>
        </main>
      }
    >
      <VerificarEmailContent />
    </Suspense>
  );
}
