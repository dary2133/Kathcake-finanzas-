
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Acceso Seguro",
            credentials: {
                username: { label: "Usuario", type: "text", placeholder: "admin" },
                password: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                // En producción, esto debería venir de variables de entorno
                // Fallback seguro para evitar bloqueo inmediato en despliegue
                const validUsername = process.env.ADMIN_USER || "admin";
                const validPassword = process.env.ADMIN_PASSWORD || "kathcake2024";

                if (
                    credentials?.username === validUsername &&
                    credentials?.password === validPassword
                ) {
                    return { id: "1", name: "Admin", email: "admin@kathcake.com" };
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 días
    },
    theme: {
        colorScheme: "light",
    },
    secret: process.env.NEXTAUTH_SECRET || "kathcake-secret-key-change-me-in-prod",
};
