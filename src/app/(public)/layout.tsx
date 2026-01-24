"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type FooterSettings = {
  footerDescription: string;
  footerEmail: string;
  footerPhone: string;
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticação via API
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLoggedIn(true);
          setUser(data);
        } else {
          setLoggedIn(false);
          setUser(null);
        }
      } catch {
        setLoggedIn(false);
        setUser(null);
      }
    };

    // Carregar configurações do footer
    const loadFooterSettings = async () => {
      try {
        const res = await fetch("/api/site-settings");
        if (res.ok) {
          const data = await res.json();
          setFooterSettings({
            footerDescription: data.footerDescription,
            footerEmail: data.footerEmail,
            footerPhone: data.footerPhone,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações do footer:", error);
      }
    };

    checkAuth();
    loadFooterSettings();

    // Efeito de scroll
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      localStorage.removeItem("user");
      setLoggedIn(false);
      setUser(null);
      router.push("/auth/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar com design melhorado */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 bg-white/98 backdrop-blur-xl border-b border-gray-200 ${
          scrolled ? "shadow-2xl" : "shadow-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-4">
          {/* LOGO + NOME */}
          <Link
            href="/"
            className="flex items-center gap-4 group relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Image
                src="/logo-samuel1.png"
                alt="Logo Terapias Manuais Samuel Abóbora"
                width={50}
                height={50}
                className="relative rounded-xl shadow-lg ring-2 ring-green-200 group-hover:ring-green-500 transition-all duration-500 group-hover:shadow-xl group-hover:scale-110"
                priority
              />
            </div>
            <span className="hidden md:block font-bold text-lg tracking-tight text-green-800 group-hover:text-green-600 transition-colors duration-300">
              Samuel Abóbora
            </span>
          </Link>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/servicos"
              className="relative font-medium tracking-wide group py-2"
            >
              <span className="relative z-10 text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                Serviços
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300" />
            </Link>

            <Link
              href="/sobre"
              className="relative font-medium tracking-wide group py-2"
            >
              <span className="relative z-10 text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                Sobre
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300" />
            </Link>

            <Link
              href="/contactos"
              className="relative font-medium tracking-wide group py-2"
            >
              <span className="relative z-10 text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                Contactos
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300" />
            </Link>

            {loggedIn && (
              <Link
                href="/dashboard"
                className="relative font-medium tracking-wide group py-2"
              >
                <span className="relative z-10 text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                  Área Cliente
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300" />
              </Link>
            )}

            {!loggedIn ? (
              <>
                <Link
                  href="/auth/login"
                  className="relative overflow-hidden bg-gradient-to-r from-green-700 to-green-600 border border-green-700 text-white px-5 py-2.5 rounded-lg font-semibold tracking-wide group transition-all duration-300 hover:shadow-lg hover:from-green-800 hover:to-green-700"
                >
                  <span className="relative z-10">Login</span>
                </Link>
                <Link
                  href="/register"
                  className="relative overflow-hidden bg-white border-2 border-green-700 text-green-700 px-5 py-2.5 rounded-lg font-semibold tracking-wide group transition-all duration-300 hover:bg-green-50"
                >
                  <span className="relative z-10">Registar</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {/* Botão Backoffice para Admin */}
                {user?.role === "ADMIN" && (
                  <Link
                    href="/dashboard-bo"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Backoffice
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full border border-gray-200">
                  <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">
                    {user?.name?.slice(0, 1).toUpperCase() || "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || "Utilizador"}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="relative overflow-hidden bg-red-50 border-2 border-red-200 text-red-600 px-5 py-2.5 rounded-lg font-semibold tracking-wide group transition-all duration-300 hover:bg-red-500 hover:text-white hover:border-red-500"
                >
                  <span className="relative z-10">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* BOTÃO HAMBURGER MOBILE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* MENU MOBILE */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
            <Link
              href="/servicos"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-green-50 hover:text-green-700 transition"
            >
              Serviços
            </Link>
            <Link
              href="/sobre"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-green-50 hover:text-green-700 transition"
            >
              Sobre
            </Link>
            <Link
              href="/contactos"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-green-50 hover:text-green-700 transition"
            >
              Contactos
            </Link>

            {loggedIn && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-green-50 hover:text-green-700 transition"
                >
                  Área Cliente
                </Link>
                {user?.role === "ADMIN" && (
                  <Link
                    href="/dashboard-bo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 transition"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Backoffice
                    </span>
                  </Link>
                )}
              </>
            )}

            <div className="border-t border-gray-200 pt-4 mt-4">
              {!loggedIn ? (
                <div className="space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center bg-green-700 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center border-2 border-green-700 text-green-700 px-4 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
                  >
                    Registar
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Info do utilizador */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">
                      {user?.name?.slice(0, 1).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.name || "Utilizador"}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition"
                  >
                    Terminar Sessão
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Linha decorativa inferior com gradiente */}
        <div className={`h-1 w-full bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-70"
        }`} />
      </nav>

      {/* Espaçamento para navbar fixa */}
      <div className="h-[73px]"></div>

      <main>{children}</main>

      <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
            {/* Logo e Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <Image
                  src="/logo-samuel1.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="font-bold text-green-800 text-lg">Samuel Abóbora</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {footerSettings?.footerDescription || "Terapias manuais especializadas para o seu bem-estar físico e mental."}
              </p>
            </div>

            {/* Contacto */}
            <div className="text-center md:text-left">
              <h3 className="font-bold text-gray-900 mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {footerSettings?.footerEmail || "contato@samuelabobora.pt"}
                </li>
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {footerSettings?.footerPhone || "+351 XXX XXX XXX"}
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Samuel Abóbora · Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
