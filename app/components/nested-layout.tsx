"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import NavBar from "./navbar";

const NestedLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: session, status } = useSession();

  const useAdminGuard = () => {
    const router = useRouter();

    useEffect(() => {
      if (status === "loading") {
        setIsLoading(true);
        return;
      }

      setIsLoading(false);

      if (!session) {
        setIsAdmin(false);
        router.replace("/");
        return;
      }

      if (!session.user?.role || session.user.role !== "admin") {
        console.log("session", session);
        console.log("User is not admin");
        setIsAdmin(false);
      } else {
        console.log("session", session);
        console.log("User is admin - setting isAdmin to true");
        setIsAdmin(true);
      }
    }, [session, status, router]);
  };

  useAdminGuard();

  // Não renderiza nada enquanto estiver carregando para evitar flash de conteúdo
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <>
      {isAdmin && <NavBar />}
      {children}
      {!isAdmin && session && (
        <>
          {/* Botão flutuante no canto inferior direito */}
          <div className="fixed bottom-6 right-6 z-50">
            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 px-1 min-w-[160px] mb-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
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
                  Sair
                </button>
              </div>
            )}

            {/* Botão do avatar */}
            <button
              onClick={toggleUserMenu}
              className={`w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-105 ${
                showUserMenu ? "ring-4 ring-blue-200" : ""
              }`}
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Overlay para fechar o menu quando clicar fora */}
          {showUserMenu && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUserMenu(false)}
            />
          )}
        </>
      )}
    </>
  );
};

export default NestedLayout;
