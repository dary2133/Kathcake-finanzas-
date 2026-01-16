
export { default } from "next-auth/middleware";

export const config = {
    matcher: [
        "/cuentas/:path*",
        "/cuentas-kathcake/:path*",
        "/gastos/:path*",
        "/ingresos/:path*",
        "/reportes/:path*",
        "/configuracion/:path*",
        "/", // Protect home as well if dashboard is there
    ],
};
