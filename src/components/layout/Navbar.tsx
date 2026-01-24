"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Verificar se está na área de cliente
  const isInClientArea = pathname?.startsWith("/dashboard") || pathname?.startsWith("/marcacoes") || pathname?.startsWith("/perfil");

  useEffect(() => {
    // Verificar localStorage apenas no cliente
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setLoggedIn(true);
      } catch {
        setLoggedIn(false);
      }
    }

    // Efeito de scroll
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLoggedIn(false);
    setUser(null);
    router.push("/login");
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage("");

    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setResendMessage("Email enviado com sucesso! Verifique a sua caixa de entrada.");
      } else {
        setResendMessage(data.error || "Erro ao enviar email.");
      }
    } catch {
      setResendMessage("Erro de conexão. Tente novamente.");
    } finally {
      setResending(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 bg-white/98 backdrop-blur-xl border-b border-gray-200 ${
        scrolled ? "shadow-2xl" : "shadow-lg"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
        {/* LOGO + NOME */}
        <Link
          href="/"
          className="flex items-center gap-4 group relative"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent-cyan/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Image
              src="/logo-samuel1.png"
              alt="Logo Terapias Manuais Samuel Abóbora"
              width={50}
              height={50}
              className="relative rounded-xl shadow-glass ring-2 ring-primary-200 group-hover:ring-primary-500 transition-all duration-500 group-hover:shadow-neon-sm group-hover:scale-110"
              priority
            />
          </div>
          <span className="hidden md:block font-display font-bold text-lg tracking-tight text-primary-700 group-hover:text-primary-500 transition-colors duration-300">
            Samuel Abóbora
          </span>
        </Link>

        {/* MENU */}
        <div className="flex items-center gap-8 text-sm">
          <Link
            href="/servicos"
            className="relative font-medium tracking-wide group py-2"
          >
            <span className="relative z-10 text-gray-700 group-hover:text-primary-600 transition-colors duration-300">
              Serviços
            </span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300" />
          </Link>

          <Link
            href="/sobre"
            className="relative font-medium tracking-wide group py-2"
          >
            <span className="relative z-10 text-gray-700 group-hover:text-primary-600 transition-colors duration-300">
              Sobre
            </span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300" />
          </Link>

          <Link
            href="/contactos"
            className="relative font-medium tracking-wide group py-2"
          >
            <span className="relative z-10 text-gray-700 group-hover:text-primary-600 transition-colors duration-300">
              Contactos
            </span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300" />
          </Link>

          {!loggedIn ? (
            <Link
              href="/login"
              className="relative overflow-hidden bg-linear-to-r from-primary-600 to-primary-500 border border-primary-600 text-white px-5 py-2.5 rounded-lg font-semibold tracking-wide group transition-all duration-300 hover:shadow-neon-sm hover:from-primary-700 hover:to-primary-600"
            >
              <span className="relative z-10">Área Cliente</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className={`relative overflow-hidden px-5 py-2.5 rounded-lg font-semibold tracking-wide transition-all duration-300 ${
                  isInClientArea
                    ? "bg-linear-to-r from-primary-700 to-primary-600 text-white shadow-lg shadow-primary-500/30 ring-2 ring-primary-400 ring-offset-2"
                    : "bg-linear-to-r from-primary-600 to-primary-500 border border-primary-600 text-white hover:shadow-neon-sm hover:from-primary-700 hover:to-primary-600"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isInClientArea && (
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                  Área Cliente
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="relative overflow-hidden bg-red-50 border-2 border-red-200 text-red-600 px-4 py-2.5 rounded-lg font-semibold tracking-wide group transition-all duration-300 hover:bg-red-500 hover:text-white hover:border-red-500"
              >
                <span className="relative z-10">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Linha decorativa inferior com gradiente - fica mais vibrante no scroll */}
      <div className={`h-1 w-full bg-linear-to-r from-primary-500 via-accent-emerald to-accent-cyan transition-opacity duration-500 ${
        scrolled ? "opacity-100" : "opacity-70"
      }`} />

      {/* Aviso de email não verificado */}
      {loggedIn && user && !user.emailVerified && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-yellow-800">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Email não verificado.</strong> Verifique o seu email para poder fazer marcações.
              </span>
            </div>
            <button
              onClick={() => setShowVerificationModal(true)}
              className="text-yellow-700 hover:text-yellow-900 font-semibold underline"
            >
              Reenviar email
            </button>
          </div>
        </div>
      )}

      {/* Modal de reenvio de verificação */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Verificar Email</h3>
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setResendMessage("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Para fazer marcações, precisa de verificar o seu email. Clique no botão abaixo para receber um novo email de verificação.
            </p>

            {resendMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                resendMessage.includes("sucesso")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {resendMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="flex-1 bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50"
              >
                {resending ? "A enviar..." : "Enviar Email de Verificação"}
              </button>
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setResendMessage("");
                }}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
