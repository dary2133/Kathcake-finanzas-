import { useState, useEffect } from 'react';
import {
    Truck,
    Search,
    Plus,
    Smartphone,
    Mail,
    Package,
    ShoppingCart,
    Edit3,
    Trash2,
    X,
    Loader2,
    ClipboardList
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Supplier {
    id: string;
    name: string;
    category: string;
    contact: string;
    phone: string;
    email: string;
    totalPurchased: number;
    pendingOrders: number;
}

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data
        setSuppliers([
            { id: 's1', name: 'Lácteos del Valle', category: 'Leche y Cremas', contact: 'Juan Carlos', phone: '555-001', email: 'juan@lacteos.com', totalPurchased: 4500, pendingOrders: 1 },
            { id: 's2', name: 'Harinas Pro', category: 'Materias Primas', contact: 'Sofía Mena', phone: '555-002', email: 'sofia@harinas.com', totalPurchased: 12000, pendingOrders: 0 },
            { id: 's3', name: 'Empaques Premium', category: 'Envases', contact: 'Luis Toro', phone: '555-003', email: 'luis@empaques.com', totalPurchased: 2300, pendingOrders: 0 },
        ]);
        setLoading(false);
    }, []);

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Proveedores Estratégicos</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 italic">Gestión de abastecimiento, compras y relaciones comerciales</p>
                </div>
                <button
                    className="btn-primary h-14 px-8 shadow-xl shadow-primary-500/20 flex items-center gap-3 uppercase font-black tracking-widest text-[10px]"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Proveedor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="card-premium p-6 border-l-4 border-primary-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Proveedores Activos</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">{suppliers.length}</h3>
                </div>
                <div className="card-premium p-6 border-l-4 border-amber-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Compras del Mes</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">$18,750</h3>
                </div>
            </div>

            <div className="card-premium p-6 bg-white/50 backdrop-blur-sm border-none shadow-xl">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, categoría o contacto..."
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
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Proveedor</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Contacto</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Categoría</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Compras Totales</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-all group animate-fade-in">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-lg italic uppercase">
                                                <Truck className="w-6 h-6 opacity-30" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg uppercase italic tracking-tighter leading-none">{s.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">ID: {s.id.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-700 uppercase italic tracking-tighter">{s.contact}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <Smartphone className="w-3 h-3 text-primary-400" />
                                                {s.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black rounded-lg uppercase tracking-widest italic">
                                            {s.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="font-black text-slate-900 text-lg italic tracking-tighter">${s.totalPurchased.toLocaleString()}</p>
                                        <div className="flex items-center justify-center gap-1.5 mt-1">
                                            <Package className={`w-3 h-3 ${s.pendingOrders > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-300'}`} />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.pendingOrders} Pendientes</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <button className="p-3 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-primary-600 hover:scale-110 transition-all border border-slate-50">
                                                <ShoppingCart className="w-5 h-5" />
                                            </button>
                                            <button className="p-3 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-primary-600 hover:scale-110 transition-all border border-slate-50">
                                                <Edit3 className="w-5 h-5" />
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
