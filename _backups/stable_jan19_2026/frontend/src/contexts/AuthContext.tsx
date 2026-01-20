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

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Configurar interceptor de axios para incluir el token en cada petición
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded: any = jwtDecode(token);
                    setUser(decoded as User);

                    const res = await axios.get('/api/auth/profile');
                    if (res.data.success) {
                        setUser(res.data.data.user);
                    }
                } catch (e) {
                    console.error("Auth init error:", e);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();

        return () => axios.interceptors.request.eject(interceptor);
    }, []);

    const login = async (credential: string, password: string) => {
        try {
            const res = await axios.post('/api/auth/login', { credential, password }, { timeout: 10000 });

            if (res.data.success) {
                const { token, user } = res.data.data;
                localStorage.setItem('token', token);
                setUser(user);
                return res.data;
            }
            throw new Error(res.data.message || 'Error de autenticación');

        } catch (error: any) {
            console.error("Backend login attempt:", error);
            const message = error.response?.data?.message || error.message || 'Error de conexión';
            throw new Error(message);
        }
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
