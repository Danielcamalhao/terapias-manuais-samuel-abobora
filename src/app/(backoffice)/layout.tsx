"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/profile", {
        credentials: "include", // Garantir que os cookies são enviados
      });
      console.log("Profile response:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("Profile data:", data);
        if (data.role === "ADMIN") {
          setUser(data);
        } else {
          window.location.href = "/dashboard";
          return;
        }
      } else {
        console.log("Profile failed, redirecting to login");
        window.location.href = "/auth/login";
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      window.location.href = "/auth/login";
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/auth/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const navLinks = [
    { href: "/dashboard-bo", label: "Dashboard", icon: "📊" },
    { href: "/servicos-bo", label: "Serviços", icon: "💆" },
    { href: "/marcacoes-bo", label: "Marcações", icon: "📅" },
    { href: "/clientes-bo", label: "Utilizadores", icon: "👥" },
    { href: "/emails-bo", label: "Emails", icon: "📧" },
    { href: "/contactos-bo", label: "Contactos", icon: "✉️" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Nome */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard-bo" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  SA
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  Backoffice
                </span>
              </Link>

              {/* Nav Links Desktop */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isActive
                          ? "bg-green-100 text-green-800"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Botão para visitar site público */}
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                title="Visitar Site Público"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span className="hidden lg:inline">Ver Site</span>
              </Link>

              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition"
                title="Terminar Sessão"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden pb-4">
            <div className="flex flex-wrap gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                      isActive
                        ? "bg-green-100 text-green-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
