import { useState, useEffect } from 'react';
import {
    Users2,
    Search,
    Plus,
    Smartphone,
    Mail,
    MapPin,
    ArrowUpRight,
    MoreHorizontal,
    Edit3,
    Trash2,
    X,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    totalBought: number;
    lastVisit: string;
    debts: number;
}

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Mock data
        setCustomers([
            { id: 'c1', name: 'Ana Garcia', phone: '123-456-7890', email: 'ana@example.com', address: 'Calle Principal #123', totalBought: 1250, lastVisit: '2026-01-15', debts: 0 },
            { id: 'c2', name: 'Roberto Sanchez', phone: '987-654-3210', email: 'roberto@example.com', address: 'Av. Libertad #45', totalBought: 4500, lastVisit: '2026-01-17', debts: 150 },
            { id: 'c3', name: 'Maria Lopez', phone: '555-019-2837', email: 'maria@example.com', address: 'Paseo de las Flores #8', totalBought: 800, lastVisit: '2026-01-10', debts: 0 },
        ]);
        setLoading(false);
    }, []);

    const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Cartera de Clientes</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 italic">Gestión de fidelidad, saldos y historial de consumo</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary h-14 px-8 shadow-xl shadow-primary-500/20 flex items-center gap-3 uppercase font-black tracking-widest text-[10px]"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="card-premium p-6 border-l-4 border-primary-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Clientes</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">{customers.length}</h3>
                </div>
                <div className="card-premium p-6 border-l-4 border-amber-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Por Cobrar</p>
                    <h3 className="text-3xl font-black text-amber-600 mt-1 italic tracking-tighter">${customers.reduce((acc, c) => acc + c.debts, 0).toLocaleString()}</h3>
                </div>
            </div>

            <div className="card-premium p-6 bg-white/50 backdrop-blur-sm border-none shadow-xl">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o correo..."
                        className="input-field pl-14 h-16 text-lg font-black italic tracking-tight border-none bg-white shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card-premium overflow-hidden border-none shadow-2xl bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Cliente</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Contacto</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Consumo Total</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Saldo / Deuda</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition-all group animate-fade-in">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-lg italic uppercase">
                                                {c.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg uppercase italic tracking-tighter leading-none">{c.name}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-slate-300" />
                                                    <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{c.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Smartphone className="w-3.5 h-3.5 text-primary-400" />
                                                {c.phone}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <Mail className="w-3.5 h-3.5 text-primary-300" />
                                                {c.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="font-black text-slate-900 text-lg italic tracking-tighter">${c.totalBought.toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Última: {c.lastVisit}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-sm ${c.debts > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {c.debts > 0 ? `DEBE $${c.debts}` : 'AL DÍA'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <button className="p-3 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-primary-600 hover:scale-110 transition-all border border-slate-50">
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button className="p-3 bg-white shadow-xl rounded-2xl text-red-200 hover:text-red-500 hover:scale-110 transition-all border border-slate-50">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
