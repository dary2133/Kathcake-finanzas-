import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
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
