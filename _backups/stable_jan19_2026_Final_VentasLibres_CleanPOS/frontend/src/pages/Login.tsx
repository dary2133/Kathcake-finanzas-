import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, Mail, Loader2, Sparkles, ChefHat } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('¡Bienvenido de nuevo a Kathcake! ✨');
            navigate('/');
        } catch (err: any) {
            toast.error(err.message || 'Credenciales incorrectas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-orange-50/50 flex items-center justify-center p-6 relative overflow-hidden font-sans notranslate">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-500/5 to-transparent pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-xl w-full relative z-10 animate-fade-in">
                <div className="text-center mb-12">
                    <div className="relative inline-flex mb-8 group">
                        <div className="absolute -inset-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition duration-1000"></div>
                        <img
                            src="/logo.png"
                            alt="Kathcake Logo"
                            className="w-56 h-56 object-contain relative z-10 drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none text-slate-900 mb-4">
                        <span>Kathcake </span><span className="text-primary-600 underline underline-offset-8 decoration-4">POS</span>
                    </h1>
                    <div className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] italic flex items-center justify-center gap-3">
                        <ChefHat className="w-4 h-4 text-primary-500" />
                        <span>Repostería Gourmet de Clase Mundial</span>
                    </div>
                </div>

                <div className="card-premium p-12 bg-white/80 border border-white/50 backdrop-blur-2xl shadow-[0_50px_100px_-20px_rgba(255,27,107,0.1)]">
                    <div className="mb-10">
                        <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter mb-2"><span>Panel de Acceso</span></h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic"><span>Ingresa tus credenciales para administrar tu negocio</span></p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic"><span>E-mail o Teléfono</span></label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    className="input-field h-16 pl-14 bg-slate-50 border-slate-200 text-slate-900 font-bold tracking-tight focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-300"
                                    placeholder="E-mail (Admin) o Teléfono"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic"><span>PIN de Seguridad</span></label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="input-field h-16 pl-14 bg-slate-50 border-slate-200 text-slate-900 font-bold tracking-tight focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-300"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-20 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-100 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-primary-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Entrar al Sistema</span>
                                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="text-center mt-12 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">
                        <span>Kathcake POS &copy; 2026</span>
                    </p>
                    <div className="flex justify-center gap-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-300"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-300"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-300"></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
