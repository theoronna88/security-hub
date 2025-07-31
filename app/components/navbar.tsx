"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NavBar = () => {
  const { data: session, status } = useSession();

  // Só renderiza a navbar se o usuário for ADMIN
  if (status === "loading") {
    return null; // Ou um skeleton/loading
  }

  if (!session || session.user.role !== "admin") {
    return null; // Não mostra navbar para usuários comuns
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="bg-slate-200 border-b border-slate-300 shadow-sm">
      <div className="mx-auto flex justify-between items-center py-4 px-6">
        <div className="flex items-center space-x-4">
          <div className="text-lg font-bold text-slate-800">
            Sistema de Portas
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Administrador
          </Badge>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex space-x-4">
            <a
              href="/"
              className="text-slate-700 hover:text-slate-900 hover:underline transition-colors"
            >
              Home
            </a>
            <a
              href="/users"
              className="text-slate-700 hover:text-slate-900 hover:underline transition-colors"
            >
              Usuários
            </a>
          </div>

          <div className="flex items-center space-x-3 border-l border-slate-300 pl-6">
            <div className="text-sm text-slate-600">
              {session.user.name || session.user.email}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
