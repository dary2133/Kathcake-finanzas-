import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    Filter,
    Calendar,
    Download,
    Eye,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    X,
    Plus,
    Lock,
    Unlock,
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    Wallet,
    Receipt,
    History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Movement {
    _id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
    createdAt: string;
    paymentMethod: string;
    reference?: string;
}

export default function Movements() {
    const [tab, setTab] = useState<'transactions' | 'closures'>('transactions');
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [isCashOpen, setIsCashOpen] = useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    // Summary Stats
    const [summary, setSummary] = useState({
        balance: 12450.50,
        income: 18900.00,
        expense: 6449.50
    });

    const isDemo = localStorage.getItem('token') === 'demo-token-123';
    const currency = 'RD$';

    useEffect(() => {
        if (isDemo) {
            const mockMovements: Movement[] = [
                { _id: 'm1', type: 'income', category: 'Venta', amount: 2500, description: 'Venta de Pastel Red Velvet', createdAt: new Date().toISOString(), paymentMethod: 'Efectivo', reference: 'FACT-001' },
                { _id: 'm2', type: 'expense', category: 'Insumos', amount: 1200, description: 'Compra de fresas y crema de leche', createdAt: new Date().toISOString(), paymentMethod: 'Efectivo' },
                { _id: 'm3', type: 'income', category: 'Venta', amount: 850, description: 'Pack de Cupcakes Vainilla (6)', createdAt: new Date().toISOString(), paymentMethod: 'Transferencia', reference: 'FACT-002' },
                { _id: 'm4', type: 'expense', category: 'Servicios', amount: 3500, description: 'Pago de Electricidad Local', createdAt: new Date().toISOString(), paymentMethod: 'Tarjeta' },
            ];
            setMovements(mockMovements);
            setLoading(false);
        } else {
            fetchMovements();
        }
    }, [isDemo]);

    const fetchMovements = async () => {
        setLoading(true);
        // Fallback for demo
        setLoading(false);
    };

    const handleCashToggle = () => {
        if (isCashOpen) {
            toast.success('Caja cerrada exitosamente. Generando reporte...');
        } else {
            toast.success('Caja abierta. ¡Que tengas un excelente día de ventas! 🎂🚀');
        }
        setIsCashOpen(!isCashOpen);
    };

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <History className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Flujo de Caja</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-4 italic flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-primary-500" />
                        Repostería Gourmet • Control Total
                    </p>
                </div>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <button
                        onClick={handleCashToggle}
                        className={`h-16 px-8 rounded-2xl flex items-center gap-4 uppercase font-black tracking-widest text-[10px] transition-all shadow-xl ${isCashOpen ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-2 border-slate-100'}`}
                    >
                        {isCashOpen ? <Lock className="w-5 h-5 text-primary-500" /> : <Unlock className="w-5 h-5" />}
                        {isCashOpen ? 'Cerrar Turno' : 'Abrir Caja'}
                    </button>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="h-16 px-8 rounded-2xl flex items-center gap-4 uppercase font-black tracking-widest text-[10px] bg-red-500 text-white shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Wallet className="w-5 h-5" />
                        Registrar Gasto
                    </button>
                    <button className="h-16 px-10 rounded-2xl flex items-center gap-4 uppercase font-black tracking-widest text-[10px] bg-primary-600 text-white shadow-xl shadow-primary-500/20 hover:opacity-90 transition-all">
                        <Download className="w-5 h-5" />
                        Reporte Diario
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="card-premium p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Wallet className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-6">Balance de Caja</p>
                        <h3 className="text-6xl font-black italic tracking-tighter">{currency}{summary.balance.toLocaleString()}</h3>
                        <div className="flex items-center gap-3 mt-10">
                            <span className="w-3 h-3 rounded-full bg-primary-500 animate-pulse shadow-[0_0_15px_rgba(255,27,107,0.5)]"></span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fondos en Puntos de Venta</p>
                        </div>
                    </div>
                </div>

                <div className="card-premium p-10 border-l-[10px] border-emerald-500 bg-emerald-50/20 shadow-xl shadow-emerald-500/5 hover:-translate-y-2 transition-transform duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-5 bg-emerald-100 rounded-[1.5rem] text-emerald-600 shadow-inner">
                            <TrendingUp className="w-10 h-10" />
                        </div>
                        <span className="px-5 py-2 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">+12.5%</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-3">Ventas Totales</p>
                        <h3 className="text-5xl font-black text-slate-900 italic tracking-tighter">{currency}{summary.income.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="card-premium p-10 border-l-[10px] border-red-500 bg-red-50/20 shadow-xl shadow-red-500/5 hover:-translate-y-2 transition-transform duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <div className="p-5 bg-red-100 rounded-[1.5rem] text-red-600 shadow-inner">
                            <TrendingDown className="w-10 h-10" />
                        </div>
                        <span className="px-5 py-2 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full">-4.2%</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-3">Gastos Operativos</p>
                        <h3 className="text-5xl font-black text-slate-900 italic tracking-tighter">{currency}{summary.expense.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col gap-10">
                <div className="flex items-center gap-10 border-b border-slate-100 px-6">
                    <button
                        onClick={() => setTab('transactions')}
                        className={`pb-6 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${tab === 'transactions' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Libro de Transacciones
                        {tab === 'transactions' && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-primary-500 rounded-full animate-fade-in shadow-[0_0_10px_rgba(255,27,107,0.3)]"></div>}
                    </button>
                    <button
                        onClick={() => setTab('closures')}
                        className={`pb-6 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${tab === 'closures' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Historial de Cierres
                        {tab === 'closures' && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-primary-500 rounded-full animate-fade-in shadow-[0_0_10px_rgba(255,27,107,0.3)]"></div>}
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-end bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-inner">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Desde</label>
                            <input type="date" className="input-field h-14 font-black text-xs uppercase" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Hasta</label>
                            <input type="date" className="input-field h-14 font-black text-xs uppercase" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Filtrar Descripción</label>
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input type="text" placeholder="Ej. Pago local de luz..." className="input-field pl-14 h-14 font-bold text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="card-premium overflow-hidden border-none shadow-2xl bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Detalle del Movimiento</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Categoría</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic text-center">Método</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic text-right">Monto</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic text-right">Ficha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {movements.map((m) => (
                                <tr key={m._id} className="hover:bg-slate-50/30 transition-all group animate-fade-in cursor-pointer">
                                    <td className="px-10 py-8">
                                        <div className="flex gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${m.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                {m.type === 'income' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-xl uppercase italic tracking-tighter leading-tight group-hover:text-primary-600 transition-colors">{m.description}</p>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">
                                                    {format(new Date(m.createdAt), "EEEE dd 'de' MMMM • HH:mm a", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="px-5 py-2 bg-slate-100 text-slate-600 text-[10px] font-black rounded-[0.75rem] uppercase tracking-widest italic group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                                            {m.category}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{m.paymentMethod}</p>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{m.reference || 'REF-N/A'}</p>
                                    </td>
                                    <td className={`px-10 py-8 text-right font-black text-2xl italic tracking-tighter ${m.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {m.type === 'income' ? '+' : '-'}{currency}{m.amount.toLocaleString()}
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button className="p-4 bg-white shadow-xl rounded-2xl text-slate-200 hover:text-primary-500 hover:scale-110 transition-all border border-slate-50 active:scale-95">
                                            <Eye className="w-6 h-6" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" onClick={() => setIsExpenseModalOpen(false)}></div>
                    <form className="relative bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in border border-white/20">
                        <div className="p-12 pb-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/50">
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Registrar Gasto</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 italic text-red-500">Salida de Efectivo / Caja</p>
                            </div>
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-3xl transition-all group">
                                <X className="w-8 h-8 text-slate-300 group-hover:text-slate-600" />
                            </button>
                        </div>
                        <div className="p-12 space-y-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Concepto del Gasto</label>
                                <input type="text" className="input-field h-16 font-black text-xl italic tracking-tighter uppercase" placeholder="Ej. Pago de Alquiler de Local..." />
                            </div>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Monto ({currency})</label>
                                    <input type="number" className="input-field h-16 font-black text-2xl italic tracking-tighter" placeholder="0.00" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Método de Pago</label>
                                    <select className="input-field h-16 font-black text-[10px] uppercase appearance-none bg-slate-50">
                                        <option>Efectivo de Caja</option>
                                        <option>Tarjeta Corporativa</option>
                                        <option>Transferencia</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Categoría Operativa</label>
                                <select className="input-field h-16 font-black text-[10px] uppercase appearance-none bg-slate-50">
                                    <option>Insumos / Ingredientes</option>
                                    <option>Servicios Públicos</option>
                                    <option>Local / Renta</option>
                                    <option>Sueldos y Comisiones</option>
                                    <option>Publicidad y Diseño</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-12 bg-slate-900 flex gap-6">
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 h-20 font-black uppercase text-slate-500 italic text-sm">Cancelar</button>
                            <button
                                type="button"
                                onClick={() => { setIsExpenseModalOpen(false); toast.success('Gasto registrado exitosamente'); }}
                                className="flex-[3] bg-red-500 hover:bg-red-400 text-white h-20 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-500/30 flex items-center justify-center transition-all "
                            >
                                Confirmar Salida
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
