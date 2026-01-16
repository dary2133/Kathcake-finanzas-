import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "kathcake-secret-key-change-me-in-prod",
});

export const config = {
    matcher: [
        "/cuentas/:path*",
        "/cuentas-kathcake/:path*",
        "/gastos/:path*",
        "/ingresos/:path*",
        "/reportes/:path*",
        "/configuracion/:path*",
        "/",
    ],
};
