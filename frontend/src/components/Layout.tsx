import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Users,
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    Settings as SettingsIcon,
    Users2,
    Truck,
    LineChart,
    ChefHat
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { icon: LayoutDashboard, label: 'Panel Principal', path: '/' },
    { icon: ShoppingBag, label: 'Punto de Venta', path: '/pos' },
    { icon: LineChart, label: 'Movimientos', path: '/movements' },
    { icon: Package, label: 'Inventario', path: '/products' },
    { icon: Users2, label: 'Clientes', path: '/customers' },
    { icon: Truck, label: 'Proveedores', path: '/suppliers' },
    { icon: Users, label: 'Equipo', path: '/users', adminOnly: true },
    { icon: SettingsIcon, label: 'Configuración', path: '/settings', adminOnly: true },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const currentRouteLabel = navItems.find(i => i.path === location.pathname)?.label || 'Búsqueda';

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden notranslate">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-80 bg-slate-900 text-white shadow-2xl relative z-40">
                <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-r from-primary-500 to-accent-500"></div>

                <div className="p-10 flex flex-col items-center gap-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-primary-500/20 rounded-full opacity-30 blur-2xl group-hover:opacity-100 transition duration-1000"></div>
                        <img
                            src="/Kath Cake logo Vector33.png"
                            alt="Kathcake Logo"
                            className="w-44 h-44 object-contain relative z-10"
                        />
                    </div>
                    <div className="text-center relative z-10">
                        <div className="text-3xl font-black italic uppercase tracking-tighter text-white">
                            <span>Kathcake </span><span className="text-primary-500">POS</span>
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 italic flex items-center justify-center gap-2">
                            <ChefHat className="w-3 h-3 text-primary-500" />
                            <span>Repostería Gourmet</span>
                        </div>
                    </div>

                    {/* Indicador de Modo Demo */}
                    {localStorage.getItem('token') === 'demo-token-123' && (
                        <div className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full animate-pulse relative z-10">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400">⚠️ Modo Demo (No guarda)</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-6 py-10 space-y-3 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        // Si es admin, ve todo
                        if (user.role === 'admin') {
                            // Mostrar item
                        } else {
                            // Si es vendedor, verificar permisos
                            if (item.adminOnly) return null;

                            // Mapeo de rutas a llaves de permisos
                            const permissionMap: Record<string, string> = {
                                '/pos': 'pos',
                                '/movements': 'movements',
                                '/products': 'inventory',
                                '/customers': 'customers',
                                '/suppliers': 'suppliers',
                                '/settings': 'settings'
                            };

                            const permKey = permissionMap[item.path];
                            const userPerms = user.permissions as Record<string, boolean> || {};

                            // Mapeo inverso de maestros a granulares para consistencia en UI
                            const granularMap: Record<string, string[]> = {
                                'inventory': ['canManageInventory', 'canCreateProducts', 'canEditProducts'],
                                'pos': ['canCreateSales'],
                                'movements': ['canViewReports'],
                                'settings': ['canManageUsers']
                            };

                            const hasMasterPerm = permKey && userPerms[permKey];
                            const hasGranularPerm = permKey && granularMap[permKey]?.some(gp => userPerms[gp]);

                            // Si la ruta tiene un permiso definido y el usuario no lo tiene ni tiene granular, ocultar
                            if (permKey && !hasMasterPerm && !hasGranularPerm) return null;
                        }

                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group ${isActive
                                    ? 'bg-primary-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-primary-400'}`} />
                                <span className={`uppercase tracking-[0.2em] text-[10px] italic ${isActive ? 'font-black' : 'font-bold'}`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-lg"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-8 border-t border-white/5 bg-slate-900/40">
                    <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 flex items-center gap-4 mb-6 group cursor-pointer transition-all hover:bg-white/10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-black italic shadow-lg group-hover:rotate-12 transition-all">
                            <span>{user.name?.[0] || 'U'}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-black text-white truncate uppercase italic tracking-tighter">{user.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{user.role}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 text-slate-500 hover:text-red-400 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] hover:bg-white/5 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                {/* Header */}
                <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-3 bg-slate-50 rounded-2xl text-slate-500">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden md:flex items-center gap-2 text-slate-400">
                            <Link to="/" className="text-[10px] font-black uppercase tracking-widest hover:text-primary-500 transition-all font-bold">Dashboard</Link>
                            <span className="text-slate-200">/</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic underline underline-offset-4 decoration-primary-500 decoration-2">
                                {currentRouteLabel}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-12 hidden xl:block">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Busca pedidos, clientes o productos..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 focus:bg-white focus:ring-[10px] focus:ring-primary-500/5 transition-all font-bold text-sm tracking-tight shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-primary-500 transition-all relative">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary-500 rounded-full border-4 border-white"></span>
                            </button>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="flex items-center gap-5">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">{user.name}</div>
                                <div className="text-[9px] font-black text-primary-500 uppercase tracking-[0.3em] mt-1">Conectado</div>
                            </div>
                            <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center font-black shadow-xl italic text-2xl border-[3px] border-white transform hover:rotate-6 transition-all cursor-pointer">
                                <span>{user.name?.[0] || 'U'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1800px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}></div>
                    <nav className="absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-slate-900 p-10 shadow-2xl flex flex-col text-white">
                        <div className="flex items-center justify-between mb-12">
                            <img
                                src="/Kath Cake logo Vector33.png"
                                alt="Kathcake Logo"
                                className="w-32 h-32 object-contain"
                            />
                            <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white/5 rounded-2xl text-slate-400">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto">
                            {navItems.map((item) => {
                                // Si es admin, ve todo
                                if (user.role === 'admin') {
                                    // Mostrar item
                                } else {
                                    // Si es vendedor, verificar permisos
                                    if (item.adminOnly) return null;

                                    // Mapeo de rutas a llaves de permisos
                                    const permissionMap: Record<string, string> = {
                                        '/pos': 'pos',
                                        '/movements': 'movements',
                                        '/products': 'inventory',
                                        '/customers': 'customers',
                                        '/suppliers': 'suppliers',
                                        '/settings': 'settings'
                                    };

                                    const permKey = permissionMap[item.path];
                                    const userPerms = user.permissions as Record<string, boolean> || {};

                                    if (permKey && !userPerms[permKey]) return null;
                                }

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all ${location.pathname === item.path
                                            ? 'bg-primary-500 text-white shadow-xl font-black'
                                            : 'text-slate-400 hover:bg-white/5'
                                            }`}
                                    >
                                        <item.icon className="w-6 h-6" />
                                        <span className="uppercase tracking-[0.2em] text-[11px] font-black italic">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            )}
        </div>
    );
}
