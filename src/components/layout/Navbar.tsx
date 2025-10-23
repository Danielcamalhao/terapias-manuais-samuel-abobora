"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar localStorage apenas no cliente
    const user = localStorage.getItem("user");
    if (user) {
      setLoggedIn(true);
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
    router.push("/login");
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
            <button
              onClick={handleLogout}
              className="relative overflow-hidden bg-red-50 border-2 border-red-200 text-red-600 px-5 py-2.5 rounded-lg font-semibold tracking-wide group transition-all duration-300 hover:bg-red-500 hover:text-white hover:border-red-500"
            >
              <span className="relative z-10">Terminar Sessão</span>
            </button>
          )}
        </div>
      </div>

      {/* Linha decorativa inferior com gradiente - fica mais vibrante no scroll */}
      <div className={`h-1 w-full bg-linear-to-r from-primary-500 via-accent-emerald to-accent-cyan transition-opacity duration-500 ${
        scrolled ? "opacity-100" : "opacity-70"
      }`} />
    </nav>
  );
}
