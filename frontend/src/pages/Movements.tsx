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
    History,
    Edit3,
    Trash2,
    Plus,
    Minus,
    Printer,
    FileText
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

    // Sale Detail State
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isEditingSale, setIsEditingSale] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    // Closure Detail State
    const [selectedClosure, setSelectedClosure] = useState<any>(null);
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
    const [isEditingClosure, setIsEditingClosure] = useState(false);

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
                params: { startDate, endDate }
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

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            if (res.data.success) {
                setProducts(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    useEffect(() => {
        if (tab === 'transactions') {
            fetchMovements();
        } else {
            fetchClosures();
        }
    }, [startDate, endDate, search, filterTab, tab]);

    useEffect(() => {
        if (isEditingSale) {
            fetchProducts();
        }
    }, [isEditingSale]);

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
                                    <tr
                                        key={m._id}
                                        onClick={async () => {
                                            if (m.type === 'income') {
                                                try {
                                                    const res = await axios.get(`/api/sales/${m._id}`);
                                                    if (res.data.success) {
                                                        setSelectedSale(res.data.data);
                                                        setIsSaleModalOpen(true);
                                                    }
                                                } catch (err) {
                                                    // Si no es una venta (es un movimiento de ingreso manual), podríamos abrir otro modal o nada
                                                    // Por ahora asumimos que los ingresos en movimientos son ventas si tienen referencia
                                                    toast.error('No se pudo cargar el detalle de la venta');
                                                }
                                            }
                                        }}
                                        className="hover:bg-slate-50/50 transition-all group animate-fade-in cursor-pointer"
                                    >
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
                                    <tr
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedClosure(c);
                                            setIsClosureModalOpen(true);
                                        }}
                                        className="hover:bg-slate-50/50 transition-all group animate-fade-in cursor-pointer"
                                    >
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

            {/* SALE DETAIL MODAL - Trenta Style */}
            {isSaleModalOpen && selectedSale && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsSaleModalOpen(false); setIsEditingSale(false); }}></div>
                    <div className="relative bg-white w-full max-w-md h-full shadow-2xl animate-slide-left flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 italic uppercase">Detalle de la venta</h3>
                            </div>
                            <button onClick={() => { setIsSaleModalOpen(false); setIsEditingSale(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {/* Sale Info Summary */}
                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                                    {selectedSale.items?.length} {selectedSale.items?.length === 1 ? 'Producto' : 'Productos'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-300">Transacción #{selectedSale.invoiceNumber?.split('-').pop()}</p>
                            </div>

                            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor total</span>
                                    {!isEditingSale ? (
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${selectedSale.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {selectedSale.status === 'paid' ? 'Pagada' : 'A Crédito'}
                                        </span>
                                    ) : (
                                        <select
                                            value={selectedSale.status}
                                            onChange={(e) => setSelectedSale({ ...selectedSale, status: e.target.value })}
                                            className="bg-white border border-slate-200 rounded-lg text-[8px] font-black px-2 py-0.5 uppercase outline-none"
                                        >
                                            <option value="paid">Pagada</option>
                                            <option value="credit">A Crédito</option>
                                        </select>
                                    )}
                                </div>
                                <div className="text-3xl font-black text-slate-900 italic tracking-tighter">
                                    {currency}{selectedSale.total.toLocaleString()}
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-400 font-bold uppercase">Subtotal sin impuestos</span>
                                        <span className="text-slate-600 font-black">{currency}{selectedSale.subtotal?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-400 font-bold uppercase">Impuestos</span>
                                        <span className="text-slate-600 font-black">{currency}{selectedSale.tax?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] pt-2 border-t border-slate-100/50">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal con impuestos</span>
                                        <span className="text-slate-900 font-black">{currency}{selectedSale.total?.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <History className="w-4 h-4 text-slate-300" />
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] items-center font-black uppercase tracking-widest text-slate-400">Fecha y hora</span>
                                            {!isEditingSale ? (
                                                <span className="text-[11px] font-bold text-slate-700">{format(new Date(selectedSale.createdAt), "hh:mm a | d MMMM yyyy", { locale: es })}</span>
                                            ) : (
                                                <input
                                                    type="datetime-local"
                                                    value={format(new Date(selectedSale.createdAt), "yyyy-MM-dd'T'HH:mm")}
                                                    onChange={(e) => setSelectedSale({ ...selectedSale, createdAt: e.target.value })}
                                                    className="bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 px-2 py-1 outline-none w-full"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Wallet className="w-4 h-4 text-slate-300" />
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método de pago</span>
                                            {!isEditingSale ? (
                                                <span className="text-[11px] font-bold text-slate-700 uppercase">
                                                    {selectedSale.paymentMethod === 'cash' ? 'Efectivo' :
                                                        selectedSale.paymentMethod === 'card' ? 'Tarjeta' :
                                                            selectedSale.paymentMethod === 'transfer' ? 'Transferencia' : selectedSale.paymentMethod}
                                                </span>
                                            ) : (
                                                <select
                                                    value={selectedSale.paymentMethod}
                                                    onChange={(e) => setSelectedSale({ ...selectedSale, paymentMethod: e.target.value })}
                                                    className="bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 px-2 py-1 outline-none w-full uppercase"
                                                >
                                                    <option value="cash">Efectivo</option>
                                                    <option value="card">Tarjeta</option>
                                                    <option value="transfer">Transferencia</option>
                                                    <option value="other">Otro</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Search className="w-4 h-4 text-slate-300" />
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</span>
                                            {!isEditingSale ? (
                                                <span className="text-[11px] font-bold text-slate-700">{selectedSale.customer?.name || 'Venta de mostrador'}</span>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={selectedSale.customer?.name || ''}
                                                    onChange={(e) => setSelectedSale({ ...selectedSale, customer: { ...selectedSale.customer, name: e.target.value } })}
                                                    placeholder="Nombre del cliente"
                                                    className="bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 px-2 py-1 outline-none w-full"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products List */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Listado de productos</h4>
                                <div className="space-y-3">
                                    {selectedSale.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                <ShoppingBag className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-slate-900 uppercase truncate">{item.productName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400">{item.quantity} Unidades</span>
                                                    <span className="text-[8px] text-slate-300">•</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{currency}{item.unitPrice.toLocaleString()} x Und</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-black text-slate-900 italic tracking-tighter">{currency}{item.subtotal.toLocaleString()}</p>
                                                {isEditingSale && (
                                                    <div className="flex items-center gap-2 mt-1 justify-end">
                                                        <button
                                                            onClick={() => {
                                                                const newItems = [...selectedSale.items];
                                                                if (newItems[idx].quantity > 1) {
                                                                    newItems[idx].quantity -= 1;
                                                                    newItems[idx].subtotal = newItems[idx].quantity * newItems[idx].unitPrice;

                                                                    // Recalcular el total de la venta de forma simplificada para el UI
                                                                    const newSubtotal = newItems.reduce((acc, it) => acc + it.subtotal, 0);
                                                                    const newTax = newSubtotal * 0.18;
                                                                    const newTotal = newSubtotal + newTax;

                                                                    setSelectedSale({ ...selectedSale, items: newItems, subtotal: newSubtotal, tax: newTax, total: newTotal });
                                                                } else {
                                                                    newItems.splice(idx, 1);
                                                                    const newSubtotal = newItems.length > 0 ? newItems.reduce((acc, it) => acc + it.subtotal, 0) : 0;
                                                                    const newTax = newSubtotal * 0.18;
                                                                    const newTotal = newSubtotal + newTax;
                                                                    setSelectedSale({ ...selectedSale, items: newItems, subtotal: newSubtotal, tax: newTax, total: newTotal });
                                                                }
                                                            }}
                                                            className="p-1 bg-red-50 text-red-500 rounded-lg"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newItems = [...selectedSale.items];
                                                                newItems[idx].quantity += 1;
                                                                newItems[idx].subtotal = newItems[idx].quantity * newItems[idx].unitPrice;

                                                                const newSubtotal = newItems.reduce((acc, it) => acc + it.subtotal, 0);
                                                                const newTax = newSubtotal * 0.18;
                                                                const newTotal = newSubtotal + newTax;

                                                                setSelectedSale({ ...selectedSale, items: newItems, subtotal: newSubtotal, tax: newTax, total: newTotal });
                                                            }}
                                                            className="p-1 bg-emerald-50 text-emerald-500 rounded-lg"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isEditingSale && (
                                        <div className="pt-4 border-t border-dashed border-slate-200">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Agregar producto</p>
                                            <select
                                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-slate-900"
                                                onChange={(e) => {
                                                    const prod = products.find(p => (p.id === e.target.value || p._id === e.target.value));
                                                    if (prod) {
                                                        const existing = selectedSale.items.find((it: any) => it.productId === (prod.id || prod._id));
                                                        if (existing) {
                                                            const newItems = selectedSale.items.map((it: any) =>
                                                                it.productId === (prod.id || prod._id) ? { ...it, quantity: it.quantity + 1, subtotal: (it.quantity + 1) * it.unitPrice } : it
                                                            );
                                                            const newSubtotal = newItems.reduce((acc: number, it: any) => acc + it.subtotal, 0);
                                                            setSelectedSale({ ...selectedSale, items: newItems, subtotal: newSubtotal, tax: newSubtotal * 0.18, total: newSubtotal * 1.18 });
                                                        } else {
                                                            const newItem = {
                                                                productId: prod.id || prod._id,
                                                                productName: prod.name,
                                                                quantity: 1,
                                                                unitPrice: prod.price,
                                                                subtotal: prod.price
                                                            };
                                                            const newItems = [...selectedSale.items, newItem];
                                                            const newSubtotal = newItems.reduce((acc: number, it: any) => acc + it.subtotal, 0);
                                                            setSelectedSale({ ...selectedSale, items: newItems, subtotal: newSubtotal, tax: newSubtotal * 0.18, total: newSubtotal * 1.18 });
                                                        }
                                                    }
                                                }}
                                                value=""
                                            >
                                                <option value="">Seleccionar producto...</option>
                                                {products.map(p => (
                                                    <option key={p.id || p._id} value={p.id || p._id}>{p.name} - {currency}{p.price}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between">
                            {!isEditingSale ? (
                                <>
                                    <div className="flex gap-4">
                                        <button className="flex flex-col items-center gap-1 group">
                                            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all">
                                                <Printer className="w-5 h-5" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-slate-400">Imprimir</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-1 group">
                                            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-slate-400">Comprobante</span>
                                        </button>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setIsEditingSale(true)}
                                            className="flex flex-col items-center gap-1 group"
                                        >
                                            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all">
                                                <Edit3 className="w-5 h-5" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-slate-400">Editar</span>
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const saleId = selectedSale.id || selectedSale._id;
                                                if (window.confirm('¿Estás seguro de que deseas eliminar esta venta? El stock se restaurará.')) {
                                                    try {
                                                        const res = await axios.delete(`/api/sales/${saleId}`);
                                                        if (res.data.success) {
                                                            toast.success('Venta eliminada correctamente');
                                                            setIsSaleModalOpen(false);
                                                            fetchMovements();
                                                        }
                                                    } catch (err) {
                                                        toast.error('Error al eliminar la venta');
                                                    }
                                                }
                                            }}
                                            className="flex flex-col items-center gap-1 group"
                                        >
                                            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:border-red-600 group-hover:text-white transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-slate-400">Eliminar</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full flex gap-3">
                                    <button
                                        onClick={() => { setIsEditingSale(false); fetchMovements(); }}
                                        className="flex-1 h-12 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const saleId = selectedSale.id || selectedSale._id;
                                            try {
                                                const res = await axios.patch(`/api/sales/${saleId}`, {
                                                    items: selectedSale.items.map((it: any) => ({
                                                        productId: it.productId,
                                                        productName: it.productName,
                                                        quantity: it.quantity,
                                                        unitPrice: it.unitPrice
                                                    })),
                                                    customer: selectedSale.customer,
                                                    paymentMethod: selectedSale.paymentMethod,
                                                    status: selectedSale.status,
                                                    createdAt: selectedSale.createdAt
                                                });
                                                if (res.data.success) {
                                                    toast.success('Venta actualizada correctamente');
                                                    setIsEditingSale(false);
                                                    setIsSaleModalOpen(false);
                                                    fetchMovements();
                                                }
                                            } catch (err) {
                                                toast.error('Error al actualizar la venta');
                                            }
                                        }}
                                        className="flex-[2] h-12 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                    >
                                        Guardar cambios
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CLOSURE DETAIL MODAL */}
            {isClosureModalOpen && selectedClosure && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsClosureModalOpen(false); setIsEditingClosure(false); }}></div>
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <History className="w-6 h-6 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 italic uppercase">Detalle del cierre</h3>
                            </div>
                            <button onClick={() => { setIsClosureModalOpen(false); setIsEditingClosure(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-300" /></button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Apertura</label>
                                    <p className="text-sm font-bold text-slate-700">{format(new Date(selectedClosure.openedAt), "d MMM, yy | hh:mm a", { locale: es })}</p>
                                    <p className="text-[10px] text-slate-400">Por: {selectedClosure.openedBy?.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cierre</label>
                                    <p className="text-sm font-bold text-slate-700">{selectedClosure.closedAt ? format(new Date(selectedClosure.closedAt), "d MMM, yy | hh:mm a", { locale: es }) : 'Caja abierta'}</p>
                                    <p className="text-[10px] text-slate-400">Por: {selectedClosure.closedBy?.name || '-'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto inicial</label>
                                        {!isEditingClosure ? (
                                            <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{currency}{selectedClosure.initialCash.toLocaleString()}</p>
                                        ) : (
                                            <input
                                                type="number"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-lg outline-none focus:border-blue-500"
                                                value={selectedClosure.initialCash}
                                                onChange={(e) => setSelectedClosure({ ...selectedClosure, initialCash: parseFloat(e.target.value) })}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto contado</label>
                                        {!isEditingClosure ? (
                                            <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{currency}{selectedClosure.countedCash?.toLocaleString() || '0'}</p>
                                        ) : (
                                            <input
                                                type="number"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-lg outline-none focus:border-blue-500"
                                                value={selectedClosure.countedCash || 0}
                                                onChange={(e) => setSelectedClosure({ ...selectedClosure, countedCash: parseFloat(e.target.value) })}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diferencia (Descuadre)</label>
                                        <p className={`text-lg font-black italic tracking-tighter ${Math.abs(selectedClosure.discrepancy || 0) < 1 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {currency}{(selectedClosure.countedCash - (selectedClosure.expectedCash || 0)).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${selectedClosure.status === 'open' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {selectedClosure.status === 'open' ? 'Activa' : 'Cerrada'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observaciones / Notas</label>
                                {!isEditingClosure ? (
                                    <p className="text-[11px] text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[60px]">{selectedClosure.notes || 'Sin observaciones'}</p>
                                ) : (
                                    <textarea
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-xs outline-none focus:border-blue-500 min-h-[100px]"
                                        value={selectedClosure.notes || ''}
                                        onChange={(e) => setSelectedClosure({ ...selectedClosure, notes: e.target.value })}
                                        placeholder="Escribe alguna observación aquí..."
                                    />
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                            {!isEditingClosure ? (
                                <>
                                    <button
                                        onClick={() => setIsEditingClosure(true)}
                                        className="flex-1 h-12 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Modificar
                                    </button>
                                    <button
                                        onClick={() => setIsClosureModalOpen(false)}
                                        className="flex-1 h-12 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                    >
                                        Cerrar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditingClosure(false)}
                                        className="flex-1 h-12 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await axios.patch(`/api/cash-register/${selectedClosure.id}`, {
                                                    initialCash: selectedClosure.initialCash,
                                                    countedCash: selectedClosure.countedCash,
                                                    notes: selectedClosure.notes
                                                });
                                                if (res.data.success) {
                                                    toast.success('Cierre actualizado correctamente');
                                                    setIsEditingClosure(false);
                                                    setIsClosureModalOpen(false);
                                                    fetchClosures();
                                                }
                                            } catch (err) {
                                                toast.error('Error al actualizar el cierre');
                                            }
                                        }}
                                        className="flex-1 h-12 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                                    >
                                        Guardar cambios
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
