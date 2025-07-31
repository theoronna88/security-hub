import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token, // Permite apenas se tiver token (JWT)
  },
  pages: {
    signIn: "/", // ✅ Aqui diz ao middleware que sua página de login é /
  },
});

export const config = {
  matcher: [
    "/portas/:path*", // Protege especificamente a rota portas
    "/users/:path*", // Protege especificamente a rota users
    "/api/:path*", // Protege todas as rotas de API
    // Adicione outras rotas específicas que precisam de proteção
  ],
};
