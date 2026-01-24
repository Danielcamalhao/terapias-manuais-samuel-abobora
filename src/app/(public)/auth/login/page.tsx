"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  // Verificar query params na inicialização
  const registeredParam = searchParams.get("registered");
  const verifiedParam = searchParams.get("verified");

  useEffect(() => {
    if (registeredParam === "true") {
      setSuccess("Conta criada com sucesso! Verifique o seu email para ativar a conta.");
    }
    if (verifiedParam === "true") {
      setSuccess("Email verificado com sucesso! Já pode fazer login.");
    }
  }, [registeredParam, verifiedParam]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage("Por favor, introduza o seu email.");
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage("");

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setForgotPasswordMessage("Se o email existir, receberá instruções para redefinir a palavra-passe.");
      } else {
        setForgotPasswordMessage(data.error || "Erro ao processar pedido.");
      }
    } catch {
      setForgotPasswordMessage("Erro de conexão. Tente novamente.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Por favor, introduza o seu email primeiro.");
      return;
    }

    setResendingVerification(true);
    setVerificationMessage("");

    try {
      const res = await fetch("/api/resend-verification-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationMessage("Email enviado! Verifique a sua caixa de correio.");
      } else {
        setVerificationMessage(data.error || "Erro ao enviar email");
      }
    } catch {
      setVerificationMessage("Erro ao processar pedido");
    } finally {
      setResendingVerification(false);
    }
  };

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

      const data = await res.json();
      console.log("Login response:", { ok: res.ok, status: res.status, data });

      if (res.ok) {
        // Guardar dados do utilizador no localStorage
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("User saved to localStorage");
        }

        // Verificar se email não está verificado
        if (!data.emailVerified) {
          setShowVerificationWarning(true);
          setLoading(false);
          return;
        }

        // Verificar se há redirect pendente
        const redirectUrl = searchParams.get("redirect");
        console.log("Redirect info:", { role: data.role, redirectUrl });

        // Redirecionar conforme o role ou para URL pendente
        if (data.role === "ADMIN") {
          console.log("Redirecting to /dashboard-bo...");
          window.location.href = "/dashboard-bo";
        } else if (redirectUrl) {
          console.log("Redirecting to:", redirectUrl);
          window.location.href = redirectUrl;
        } else {
          console.log("Redirecting to /dashboard...");
          window.location.href = "/dashboard";
        }
        return;
      } else {
        setError(data.error || "Falha no login.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Erro inesperado. Tente novamente.");
      setLoading(false);
    }
  };

  // Se o aviso de verificação está ativo, mostrar tela de aviso
  if (showVerificationWarning) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email não verificado</h1>
            <p className="text-gray-600 text-sm">
              Para continuar, precisa verificar o seu email. Verifique a sua caixa de correio (incluindo spam).
            </p>
          </div>

          {verificationMessage && (
            <p className={`text-sm mb-4 text-center p-2 rounded ${
              verificationMessage.includes("enviado")
                ? "text-green-600 bg-green-50"
                : "text-red-600 bg-red-50"
            }`}>
              {verificationMessage}
            </p>
          )}

          <button
            onClick={handleResendVerification}
            disabled={resendingVerification}
            className="w-full bg-amber-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
          >
            {resendingVerification ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                A enviar...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Reenviar Email de Verificação
              </>
            )}
          </button>

          <button
            onClick={() => {
              // Permitir continuar mesmo sem verificação (vai para o dashboard que mostra o aviso)
              const user = localStorage.getItem("user");
              if (user) {
                const userData = JSON.parse(user);
                if (userData.role === "ADMIN") {
                  window.location.href = "/dashboard-bo";
                } else {
                  window.location.href = "/dashboard";
                }
              }
            }}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-md hover:bg-gray-200 transition mb-4"
          >
            Continuar assim mesmo
          </button>

          <button
            onClick={() => {
              setShowVerificationWarning(false);
              setVerificationMessage("");
            }}
            className="w-full text-gray-500 text-sm hover:text-gray-700"
          >
            Voltar ao login
          </button>
        </div>
      </main>
    );
  }

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
          className="w-full border border-gray-300 rounded-md p-2 mb-2"
          required
        />

        <div className="text-right mb-4">
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setForgotPasswordEmail(email);
              setForgotPasswordMessage("");
            }}
            className="text-sm text-green-700 hover:text-green-800 hover:underline"
          >
            Esqueceu a palavra-passe?
          </button>
        </div>

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

      {/* Modal Esqueceu Palavra-passe */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recuperar Palavra-passe</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordMessage("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Introduza o seu email e enviaremos um link para redefinir a sua palavra-passe.
            </p>

            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="O seu email"
                className="w-full border border-gray-300 rounded-md p-3 mb-4"
                required
              />

              {forgotPasswordMessage && (
                <p className={`text-sm mb-4 p-3 rounded ${
                  forgotPasswordMessage.includes("receberá")
                    ? "text-green-700 bg-green-50"
                    : "text-red-700 bg-red-50"
                }`}>
                  {forgotPasswordMessage}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50"
                >
                  {forgotPasswordLoading ? "A enviar..." : "Enviar Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordMessage("");
                  }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
