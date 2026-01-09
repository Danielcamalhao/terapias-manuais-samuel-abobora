"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AgendarButtonProps {
  serviceId?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function AgendarButton({
  serviceId,
  className = "bg-green-700 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-800 transition",
  children = "Agendar Sessão",
}: AgendarButtonProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, []);

  const handleClick = () => {
    if (!isLoggedIn) {
      // Redirecionar para login com return URL
      const returnUrl = serviceId
        ? `/marcacoes?serviceId=${serviceId}`
        : "/marcacoes";
      router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Utilizador logado - redirecionar para marcações
    if (serviceId) {
      router.push(`/marcacoes?serviceId=${serviceId}`);
    } else {
      router.push("/marcacoes");
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
