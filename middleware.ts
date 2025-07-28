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
    "/((?!$|api|fonts|_next|_mockup|_utils|components|_api).*)", // Protege tudo, exceto:
    // "$" -> raiz ("/")
    // "api", "fonts", "_next", "_mockup", "_utils", "components", "_api"
  ],
};
