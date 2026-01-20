import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Users, TrendingUp, Sparkles, ChefHat, Wallet, Clock, ArrowUpRight, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import type { Sale } from '../types';

export default function Dashboard() {
    const { user } = useAuth();
    const [recentSales, setRecentSales] = useState<Sale[]>([]);
    const [pendingOrders, setPendingOrders] = useState<Sale[]>([]);
    const [stats, setStats] = useState({
        todaySales: 0,
        todayCount: 0,
        totalProducts: 0,
        totalUsers: 0,
        growth: '+0%'
    });
    const [loading, setLoading] = useState(true);

    const isDemo = localStorage.getItem('token') === 'demo-token-123';
    const currency = 'RD$';

    useEffect(() => {
        let isMounted = true;

        async function load() {
            if (isDemo) {
                if (isMounted) {
                    setRecentSales([
                        { _id: 's1', invoiceNumber: 'FACT-001', total: 4500, status: 'paid', createdAt: new Date().toISOString(), items: [], subtotal: 3813.56, tax: 686.44, discount: 0, discountType: 'none', paymentMethod: 'transfer', seller: { _id: 'u1', name: 'Kat', email: 'kat@test.com' }, customer: { name: 'Ana Garcia' } },
                        { _id: 's2', invoiceNumber: 'FACT-002', total: 1250, status: 'paid', createdAt: new Date().toISOString(), items: [], subtotal: 1059.32, tax: 190.68, discount: 0, discountType: 'none', paymentMethod: 'cash', seller: { _id: 'u1', name: 'Kat', email: 'kat@test.com' }, customer: { name: 'Venta Mostrador' } }
                    ]);
                    setPendingOrders([
                        { _id: 'p1', invoiceNumber: 'PED-101', total: 8500, status: 'pending', createdAt: new Date(Date.now() + 86400000).toISOString(), items: [], subtotal: 7203.39, tax: 1296.61, discount: 0, discountType: 'none', paymentMethod: 'transfer', seller: { _id: 'u1', name: 'Kat', email: 'kat@test.com' }, customer: { name: 'María Boda' } },
                        { _id: 'p2', invoiceNumber: 'PED-102', total: 3200, status: 'pending', createdAt: new Date(Date.now() + 172800000).toISOString(), items: [], subtotal: 2711.86, tax: 488.14, discount: 0, discountType: 'none', paymentMethod: 'cash', seller: { _id: 'u1', name: 'Kat', email: 'kat@test.com' }, customer: { name: 'Juan Cumpleaños' } }
                    ]);
                    setStats({
                        todaySales: 15450,
                        todayCount: 24,
                        totalProducts: 48,
                        totalUsers: 5,
                        growth: '+18.2%'
                    });
                    setLoading(false);
                }
            } else {
                try {
                    const [salesRes, productsRes, usersRes, pendingRes] = await Promise.all([
                        axios.get('/api/sales', { params: { limit: 5 } }),
                        axios.get('/api/products', { params: { limit: 1 } }),
                        axios.get('/api/users'),
                        axios.get('/api/sales', { params: { status: 'pending', limit: 5 } })
                    ]);

                    if (isMounted) {
                        const salesData = salesRes.data;
                        setRecentSales(salesData.data || []);
                        setPendingOrders(pendingRes.data.data || []);

                        setStats({
                            todaySales: salesData.statistics?.today?.total || 0,
                            todayCount: salesData.statistics?.today?.count || 0,
                            totalProducts: productsRes.data?.pagination?.total || 0,
                            totalUsers: usersRes.data?.data?.length || 0,
                            growth: salesData.statistics?.growth || '+0%'
                        });
                        setLoading(false);
                    }
                } catch (err) {
                    console.error('Error fetching dashboard data:', err);
                    if (isMounted) setLoading(false);
                }
            }
        }

        load();
        return () => { isMounted = false; };
    }, [isDemo]);

    const dashboardStats = [
        { label: 'Ingresos Hoy', value: `${currency}${stats.todaySales.toLocaleString()}`, subvalue: `${stats.todayCount} ventas realizadas`, icon: Wallet, color: 'bg-primary-50 text-primary-600' },
        { label: 'Repostería', value: stats.totalProducts.toString(), subvalue: 'Productos activos', icon: ChefHat, color: 'bg-chocolate-50 text-chocolate-600' },
        { label: 'Equipo', value: stats.totalUsers.toString(), subvalue: 'Colaboradores', icon: Users, color: 'bg-emerald-50 text-emerald-600', adminOnly: true },
        { label: 'Crecimiento', value: stats.growth, subvalue: 'Rendimiento mensual', icon: TrendingUp, color: 'bg-sky-50 text-sky-600' },
    ];

    if (!user) return null;

    const safeFormatTime = (dateStr?: string) => {
        if (!dateStr) return '--:--';
        try {
            return format(new Date(dateStr), "HH:mm a");
        } catch (e) {
            return '--:--';
        }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20 notranslate">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-500/10 to-transparent pointer-events-none"></div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-1.5 bg-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-primary-500/30">
                                <span>Panel de Control</span>
                            </span>
                            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span>Sistema en línea</span>
                            </div>
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                            <span>¡Hola, </span><span className="text-primary-400">{user.name}</span><span>!</span> <Sparkles className="inline w-10 h-10 text-yellow-400 mb-2" />
                        </h1>
                        <p className="text-slate-400 mt-4 font-medium text-lg italic uppercase tracking-widest opacity-80">
                            <span>Tu repostería gourmet está prosperando hoy.</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                        <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Clock className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{new Date().toLocaleDateString('es-DO', { weekday: 'long' })}</p>
                            <p className="text-xl font-black italic tracking-tighter uppercase">{new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {dashboardStats.map((stat, i) => {
                    if (stat.adminOnly && user.role !== 'admin') return null;
                    return (
                        <div key={i} className="card-premium p-8 group hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                <stat.icon className="w-24 h-24" />
                            </div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className={`p-4 rounded-[1.25rem] ${stat.color} shadow-inner`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] italic">ACTUALIZADO</span>
                            </div>
                            <div className="mt-8 relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{stat.label}</p>
                                <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter italic">{stat.value}</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{stat.subvalue}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 card-premium overflow-hidden border-none shadow-2xl bg-white flex flex-col">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/30">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Ventas Recientes</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 italic">Monitoreo de transacciones inmediatas</p>
                        </div>
                        <Link to="/sales" className="h-12 px-6 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[9px] hover:bg-primary-500 transition-all group">
                            Todo el Historial <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-center">
                                    <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Ticket</th>
                                    <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Cliente</th>
                                    <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Pago</th>
                                    <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic text-right">Monto Neto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest cursor-wait">Sincronizando...</td></tr>
                                ) : recentSales.length === 0 ? (
                                    <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No hay ventas recientes</td></tr>
                                ) : recentSales.map((sale) => (
                                    <tr key={sale._id} className="hover:bg-slate-50/30 transition-all group cursor-pointer">
                                        <td className="px-10 py-6 font-black text-slate-900 text-lg tracking-tighter italic text-center uppercase">{sale.invoiceNumber}</td>
                                        <td className="px-10 py-6 text-center">
                                            <div className="text-sm font-black text-slate-700 uppercase italic tracking-tighter leading-none">{sale.customer?.name || 'Mostrador'}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                <span>{safeFormatTime(sale.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded-full uppercase tracking-widest group-hover:bg-primary-500 group-hover:text-white transition-all">{sale.paymentMethod}</span>
                                        </td>
                                        <td className="px-10 py-6 font-black text-primary-600 text-xl tracking-tighter italic text-right">{currency}{(sale.total || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="card-premium p-10 bg-slate-900 border-none shadow-2xl group relative overflow-hidden transition-all hover:scale-[1.02]">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 to-accent-500"></div>
                        <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <ShoppingBag className="w-48 h-48 text-primary-500" />
                        </div>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">Nueva Orden</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed italic">Despacha a tus clientes con la mayor rapidez del mercado.</p>
                        <Link to="/pos" className="flex items-center justify-between w-full bg-primary-600 hover:bg-primary-500 text-white p-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary-500/30 transition-all active:scale-95 group/btn">
                            Abrir Punto de Venta <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                        </Link>
                    </div>

                    <div className="card-premium p-10 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Pedidos Pendientes</h3>
                            <div className="w-10 h-10 bg-chocolate-50 rounded-xl flex items-center justify-center text-chocolate-600 shadow-inner">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-6 flex-1">
                            {pendingOrders.length === 0 ? (
                                <div className="text-center py-10 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No hay pedidos pendientes</div>
                            ) : pendingOrders.map((order, i) => (
                                <div key={i} className="flex items-center gap-6 p-5 rounded-[1.5rem] hover:bg-slate-50 transition-all border-2 border-transparent hover:border-slate-50 group cursor-pointer">
                                    <div className="w-14 h-14 bg-white shadow-xl rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary-500 group-hover:rotate-12 transition-all">
                                        <Calendar className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-none">{order.invoiceNumber} - {order.customer?.name || 'Cliente'}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic">
                                            {/* Si hay fecha de entrega (esperada en order.deliveryDate? no existe en modelo. Usamos createdAt + algo o texto fijo por ahora) 
                                                Actually let's just show createdAt for now
                                            */}
                                            {format(new Date(order.createdAt), "d MMM, hh:mm a")}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-10 py-5 bg-slate-50 rounded-2xl text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.3em] transition-all italic shadow-inner">
                            Sincronizar Calendario
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
