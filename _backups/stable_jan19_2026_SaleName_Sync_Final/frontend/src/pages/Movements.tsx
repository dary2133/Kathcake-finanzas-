import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    Download,
    Eye,
    TrendingUp,
    TrendingDown,
    X,
    Lock,
    Unlock,
    ArrowUpRight,
    ArrowDownLeft,
    ShoppingBag,
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
    status: string;
}

export default function Movements() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [tab, setTab] = useState<'transactions' | 'closures'>('transactions');
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [search, setSearch] = useState('');
    const [isCashOpen, setIsCashOpen] = useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    const [filterTab, setFilterTab] = useState<'all' | 'income' | 'expense' | 'receivable' | 'payable'>('all');
    const [summary, setSummary] = useState({
        balance: 0,
        income: 0,
        expense: 0
    });

    // Expense Form Sate
    const [expenseForm, setExpenseForm] = useState({
        date: today,
        category: '',
        amount: '',
        name: '',
        provider: '',
        paymentMethod: 'cash',
        status: 'paid' // paid or debt
    });

    const currency = 'RD$';

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/movements', {
                params: {
                    startDate,
                    endDate,
                    type: filterTab === 'all' ? undefined : filterTab
                }
            });

            if (res.data.success) {
                const fetchedMovements = res.data.data || [];

                let filtered = fetchedMovements;
                if (search) {
                    filtered = filtered.filter((m: any) =>
                        m.description.toLowerCase().includes(search.toLowerCase()) ||
                        (m.reference && m.reference.toLowerCase().includes(search.toLowerCase()))
                    );
                }

                if (filterTab === 'receivable') filtered = filtered.filter((m: any) => m.type === 'income' && m.status === 'credit');
                if (filterTab === 'payable') filtered = filtered.filter((m: any) => m.type === 'expense' && m.status === 'debt');

                setMovements(filtered);

                if (res.data.summary) {
                    setSummary(res.data.summary);
                }
            }
        } catch (err) {
            console.error('Error fetching movements:', err);
            toast.error('Error al cargar movimientos');
        } finally {
            setLoading(false);
        }
    };

    const [closures, setClosures] = useState<any[]>([]);

    const fetchClosures = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/cash-register/history', {
                params: {
                    startDate,
                    endDate
                }
            });
            if (res.data.success) {
                setClosures(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching closures:', err);
            toast.error('Error al cargar cierres de caja');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tab === 'transactions') {
            fetchMovements();
        } else {
            fetchClosures();
        }
    }, [startDate, endDate, search, filterTab, tab]);

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/movements', expenseForm);
            if (res.data.success) {
                toast.success('Gasto registrado exitosamente');
                setIsExpenseModalOpen(false);
                setExpenseForm({
                    date: today,
                    category: '',
                    amount: '',
                    name: '',
                    provider: '',
                    paymentMethod: 'cash',
                    status: 'paid'
                });
                if (tab === 'transactions') fetchMovements();
            }
        } catch (err: any) {
            console.error('Error creating expense:', err);
            toast.error(err.response?.data?.message || 'Error al guardar el gasto');
        }
    };

    const handleCashToggle = () => {
        if (isCashOpen) {
            toast.success('Caja cerrada exitosamente.');
        } else {
            toast.success('Caja abierta. ✨');
        }
        setIsCashOpen(!isCashOpen);
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-900 pb-20 notranslate font-sans">
            {/* Header Tabs - New Structure */}
            <div className="flex flex-col gap-4">
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-hidden w-full md:w-fit">
                    <button onClick={() => setTab('transactions')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${tab === 'transactions' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Transacciones</button>
                    <button onClick={() => setTab('closures')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${tab === 'closures' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Cierres de caja</button>
                </div>

                {tab === 'transactions' && (
                    <div className="flex flex-wrap gap-8 items-center border-b-2 border-slate-100 pb-0">
                        {/* Filter Tabs */}
                        <button onClick={() => setFilterTab('all')} className={`pb-4 border-b-4 font-black text-[10px] uppercase tracking-widest transition-all ${filterTab === 'all' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Todas</button>
                        <button onClick={() => setFilterTab('income')} className={`pb-4 border-b-4 font-black text-[10px] uppercase tracking-widest transition-all ${filterTab === 'income' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Ingresos</button>
                        <button onClick={() => setFilterTab('expense')} className={`pb-4 border-b-4 font-black text-[10px] uppercase tracking-widest transition-all ${filterTab === 'expense' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Egresos</button>
                        <button onClick={() => setFilterTab('receivable')} className={`pb-4 border-b-4 font-black text-[10px] uppercase tracking-widest transition-all ${filterTab === 'receivable' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Por cobrar</button>
                        <button onClick={() => setFilterTab('payable')} className={`pb-4 border-b-4 font-black text-[10px] uppercase tracking-widest transition-all ${filterTab === 'payable' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Por pagar</button>
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex bg-slate-50 p-1 rounded-xl">
                    <button className="px-4 py-2 bg-white shadow-sm border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <History className="w-3 h-3" />
                        Diario
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }}
                        className="bg-slate-50 border-none rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-tighter w-40"
                    />
                </div>

                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Buscar concepto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 font-bold text-xs"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleCashToggle}
                        className={`px-6 py-3 rounded-xl flex items-center gap-3 font-black uppercase tracking-widest text-[9px] transition-all border ${isCashOpen ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-900 text-white'}`}
                    >
                        {isCashOpen ? <History className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {isCashOpen ? 'Caja abierta' : 'Caja cerrada'}
                    </button>
                    <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Descargar reporte
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Balance</p>
                        <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter mt-1">{currency}{summary.balance.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Ventas totales</p>
                        <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter mt-1">{currency}{summary.income.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                        <TrendingDown className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Gastos totales</p>
                        <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter mt-1">{currency}{summary.expense.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Content Switcher */}
            {tab === 'transactions' ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Concepto</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right">Valor</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">Medio de Pago</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right">Fecha y hora</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Sincronizando...</td></tr>
                                ) : movements.length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No hay movimientos registrados</td></tr>
                                ) : movements.map((m) => (
                                    <tr key={m._id} className="hover:bg-slate-50/50 transition-all group animate-fade-in cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                                    {m.type === 'income' ? <Receipt className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-700 uppercase leading-snug max-w-xs">{m.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-slate-900 text-sm italic tracking-tighter">
                                            {currency}{m.amount.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {m.paymentMethod === 'cash' ? 'Efectivo' :
                                                    m.paymentMethod === 'card' ? 'Tarjeta' :
                                                        m.paymentMethod === 'transfer' ? 'Transferencia' :
                                                            m.paymentMethod === 'other' ? 'Otro' : m.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {format(new Date(m.createdAt), "d/MMM/yyyy | hh:mm a", { locale: es })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${m.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                                {m.type === 'income' ? 'Pagada' : m.status === 'debt' ? 'En Deuda' : 'Egresado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Fecha de apertura</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Responsable apertura</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Fecha de cierre</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Responsable cierre</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-right">Dinero en caja</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Sincronizando...</td></tr>
                                ) : closures.length === 0 ? (
                                    <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No hay cierres de caja registrados en este periodo</td></tr>
                                ) : closures.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-all group animate-fade-in">
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                                {format(new Date(c.openedAt), "d/MMM/yyyy | hh:mm a", { locale: es })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[11px] font-bold text-slate-900 uppercase">{c.openedBy?.name || 'Desconocido'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                {c.closedAt ? format(new Date(c.closedAt), "d/MMM/yyyy | hh:mm a", { locale: es }) : '-'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[11px] font-bold text-slate-700 uppercase">{c.closedBy?.name || '-'}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-slate-900 text-sm italic tracking-tighter">
                                            {currency}{c.countedCash !== null ? c.countedCash.toLocaleString() : c.initialCash.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${c.status === 'open' ? 'bg-blue-50 text-blue-500' :
                                                    Math.abs(c.discrepancy || 0) < 1 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                                                }`}>
                                                {c.status === 'open' ? 'Abierta' :
                                                    Math.abs(c.discrepancy || 0) < 1 ? 'Caja completa' : 'Descuadre'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Expense Modal - REDESIGNED */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)}></div>
                    <form onSubmit={handleCreateExpense} className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <Wallet className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 italic uppercase">Nuevo gasto</h3>
                            </div>
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)}><X className="w-6 h-6 text-slate-300 hover:text-slate-600" /></button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                            <p className="text-[10px] text-slate-400 font-medium">Los campos marcados con asterisco (*) son obligatorios</p>

                            {/* Status Selector */}
                            <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setExpenseForm({ ...expenseForm, status: 'paid' })}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${expenseForm.status === 'paid' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:shadow-sm'}`}
                                >
                                    Pagada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpenseForm({ ...expenseForm, status: 'debt' })}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${expenseForm.status === 'debt' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-white'}`}
                                >
                                    En deuda
                                </button>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha del gasto*</label>
                                <input
                                    type="date"
                                    required
                                    value={expenseForm.date}
                                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 transition-colors"
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría del gasto*</label>
                                <select
                                    required
                                    value={expenseForm.category}
                                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 transition-colors bg-white"
                                >
                                    <option value="">Selecciona una categoría</option>
                                    <option value="servicios">Servicios (Luz, Agua, etc.)</option>
                                    <option value="insumos">Insumos / Materia Prima</option>
                                    <option value="nomina">Nómina</option>
                                    <option value="mantenimiento">Mantenimiento</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            {/* Value */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor*</label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-red-500 transition-colors">
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        value={expenseForm.amount}
                                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        className="w-full h-12 px-4 font-black text-lg outline-none text-right"
                                    />
                                    <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-t border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Valor total</span>
                                        <span className="text-sm font-black text-red-500">= {currency}{parseFloat(expenseForm.amount || '0').toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">¿Quieres darle un nombre a este gasto?</label>
                                <input
                                    type="text"
                                    placeholder="Escríbelo aquí"
                                    value={expenseForm.name}
                                    onChange={e => setExpenseForm({ ...expenseForm, name: e.target.value })}
                                    className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 transition-colors"
                                />
                            </div>

                            {/* Provider */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agrega un proveedor al gasto</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={expenseForm.provider}
                                        onChange={e => setExpenseForm({ ...expenseForm, provider: e.target.value })}
                                        className="w-full h-12 pl-10 pr-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecciona el método de pago*</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'cash' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${expenseForm.paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Wallet className="w-4 h-4 text-slate-500" /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Efectivo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'card' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${expenseForm.paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Wallet className="w-4 h-4 text-slate-500" /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Tarjeta</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'transfer' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${expenseForm.paymentMethod === 'transfer' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Wallet className="w-4 h-4 text-slate-500" /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Transferencia</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'other' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${expenseForm.paymentMethod === 'other' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-slate-500" /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Otro</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                                Crear Gasto
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
