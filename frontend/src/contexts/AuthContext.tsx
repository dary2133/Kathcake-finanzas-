import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<any>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Primero seteamos lo que tenemos en el token para que no se vea vacío
                    const decoded: any = jwtDecode(token);
                    setUser(decoded as User);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Pero inmediatamente pedimos al servidor los datos MÁS RECIENTES (permisos actualizados)
                    // Solo si no es un token de demo
                    if (token !== 'demo-token-123') {
                        const res = await axios.get('/api/auth/profile');
                        if (res.data.success) {
                            setUser(res.data.data.user);
                        }
                    }
                } catch (e) {
                    console.error("Auth init error:", e);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credential: string, password: string) => {
        try {
            // Intento de login real contra el backend
            const res = await axios.post('/api/auth/login', { credential, password }, { timeout: 10000 });

            if (res.data.success) {
                const { token, user } = res.data.data;
                localStorage.setItem('token', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(user);
                return res.data;
            }
            throw new Error(res.data.message || 'Error de autenticación');

        } catch (error: any) {
            console.error("Backend login attempt:", error);

            // Fallback para modo demostración SOLO si el servidor no responde 
            // y las credenciales coinciden con las de prueba.

            /* 
            // Demo mode fallback DISABLED to force real connection debug
            const isDemoCred = credential === 'dary.2133@hotmail.com' || credential === 'admin@kathcake.com' || credential === '8095551234';
            const isDemoPass = password === '@Rlet172624' || password === 'admin123' || password === 'password123';

            if (isDemoCred && isDemoPass) {
                // ... logic hidden ...
            }
            */


            const message = error.response?.data?.message || error.message || 'Error de conexión';
            throw new Error(message);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
