import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    Calendar,
    Download,
    Eye,
    FileText,
    DollarSign,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Sale } from '../types';

interface Statistics {
    today: { total: number; count: number };
    month: { total: number; count: number };
}

export default function Sales() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const params: any = { page };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (search) params.search = search;

            const res = await axios.get('/api/sales', { params });
            if (res.data.success) {
                setSales(res.data.data);
                setStats(res.data.statistics);
                setTotalPages(res.data.pagination.pages);
            }
        } catch (err) {
            toast.error('Error al cargar historial de ventas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [page, startDate, endDate, search]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'refunded': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'cash': return 'Efectivo';
            case 'card': return 'Tarjeta';
            case 'transfer': return 'Transferencia';
            case 'mixed': return 'Mixto';
            default: return method;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Historial de Ventas</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Consulta y gestiona todas las transacciones</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary h-12 flex items-center gap-2 uppercase font-black tracking-widest text-[10px]">
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                    <button className="btn-primary h-12 flex items-center gap-2 uppercase font-black tracking-widest text-[10px]">
                        <FileText className="w-4 h-4" />
                        Reporte Diario
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-premium p-6 flex items-center gap-6 border-l-4 border-green-500">
                    <div className="p-4 bg-green-50 rounded-2xl text-green-600">
                        <DollarSign className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Ventas de Hoy</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">
                            ${stats?.today.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{stats?.today.count || 0} transacciones</p>
                    </div>
                </div>
                <div className="card-premium p-6 flex items-center gap-6 border-l-4 border-primary-500">
                    <div className="p-4 bg-primary-50 rounded-2xl text-primary-600">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Ventas del Mes</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">
                            ${stats?.month.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{stats?.month.count || 0} transacciones</p>
                    </div>
                </div>
            </div>

            <div className="card-premium p-6 flex flex-col lg:flex-row gap-6 items-end">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                className="input-field pl-10 h-12 font-bold"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                className="input-field pl-10 h-12 font-bold"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Buscar Ticket</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="FACT-2026..."
                                className="input-field pl-10 h-12 font-bold"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); }}
                    className="btn-secondary h-12 px-8 uppercase font-black tracking-widest text-[10px]"
                >
                    Limpiar Filtros
                </button>
            </div>

            <div className="card-premium overflow-hidden border-none shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ticket</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Fecha</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cliente / Cajero</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Pago</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Total</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Consultando registros...</td></tr>
                            ) : sales.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No hay transacciones registradas</td></tr>
                            ) : sales.map((sale) => (
                                <tr key={sale._id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-5 font-black text-slate-900 italic tracking-tighter">{sale.invoiceNumber}</td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-bold text-slate-700 italic">
                                            {format(new Date(sale.createdAt), "dd MMM, yyyy", { locale: es })}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {format(new Date(sale.createdAt), "HH:mm a")}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{sale.customer?.name || 'Venta Mostrador'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sale.seller.name}</p>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-600 italic">
                                        {getPaymentMethodLabel(sale.paymentMethod)}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(sale.status)}`}>
                                            {sale.status === 'paid' ? 'Pagado' : sale.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-primary-600 text-lg italic tracking-tighter">
                                        ${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => setSelectedSale(sale)}
                                            className="p-3 bg-white shadow-lg rounded-xl text-slate-400 hover:text-primary-600 hover:scale-110 transition-all border border-slate-50"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>

            {selectedSale && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setSelectedSale(null)}></div>
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Detalle de Ticket</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedSale.invoiceNumber}</p>
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all group">
                                <X className="w-6 h-6 text-slate-300 group-hover:text-slate-600" />
                            </button>
                        </div>
                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-10 mb-10">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Cliente</p>
                                    <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedSale.customer?.name || 'Venta Mostrador'}</p>
                                    {selectedSale.customer?.phone && <p className="text-xs font-bold text-slate-500 mt-1">{selectedSale.customer.phone}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Vendido por</p>
                                    <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedSale.seller.name}</p>
                                    <p className="text-xs font-bold text-slate-500 mt-1">{selectedSale.seller.email}</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Desglose de Productos</p>
                                {selectedSale.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group">
                                        <div>
                                            <p className="font-black text-slate-900 uppercase italic tracking-tighter">{item.productName}</p>
                                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.quantity} UNI x ${item.unitPrice.toFixed(2)}</p>
                                        </div>
                                        <p className="text-xl font-black text-slate-900 italic tracking-tighter">${item.subtotal.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-900 rounded-[2rem] p-8 space-y-4 text-white">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="text-white">${selectedSale.subtotal.toFixed(2)}</span>
                                </div>
                                {selectedSale.discount > 0 && (
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-red-400">
                                        <span>Descuento</span>
                                        <span>-${selectedSale.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                                    <span>IVA (18%)</span>
                                    <span className="text-white">${selectedSale.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-4xl font-black text-white pt-6 border-t border-slate-800 italic tracking-tighter">
                                    <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Total</span>
                                    <span>${selectedSale.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 bg-slate-50 flex gap-6">
                            <button className="flex-1 btn-secondary h-16 flex items-center justify-center gap-3 uppercase font-black tracking-widest text-xs">
                                <Download className="w-5 h-5" /> Imprimir Ticket
                            </button>
                            <button className="flex-1 bg-red-500 hover:bg-red-400 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 transition-all">
                                Reembolsar Venta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
