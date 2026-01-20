import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users2,
    Search,
    Plus,
    Smartphone,
    Mail,
    MapPin,
    Edit3,
    Trash2,
    X,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Customer {
    id: string;
    _id?: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    totalBought: number;
    debts: number;
    lastVisit?: string;
}

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/customers');
            if (res.data.success) {
                setCustomers(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (editingCustomer) {
                const id = editingCustomer.id || editingCustomer._id;
                await axios.put(`/api/customers/${id}`, formData);
                toast.success('Cliente actualizado ✨');
            } else {
                await axios.post('/api/customers', formData);
                toast.success('Cliente registrado ✨');
            }
            setIsModalOpen(false);
            resetForm();
            fetchCustomers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al guardar cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (customer: Customer) => {
        const id = customer.id || customer._id;
        if (!confirm(`¿Estás seguro de eliminar a ${customer.name}?`)) return;
        try {
            await axios.delete(`/api/customers/${id}`);
            toast.success('Cliente eliminado');
            fetchCustomers();
        } catch (err) {
            toast.error('Error al eliminar cliente');
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', email: '', address: '' });
        setEditingCustomer(null);
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Cartera de Clientes</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 italic">Gestión de fidelidad, saldos y historial de consumo</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn-primary h-14 px-8 shadow-xl shadow-primary-500/20 flex items-center gap-3 uppercase font-black tracking-widest text-[10px]"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="card-premium p-6 border-l-4 border-primary-500 bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Clientes</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">{customers.length}</h3>
                </div>
                <div className="card-premium p-6 border-l-4 border-amber-500 bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Por Cobrar</p>
                    <h3 className="text-3xl font-black text-amber-600 mt-1 italic tracking-tighter">${customers.reduce((acc, c) => acc + (c.debts || 0), 0).toLocaleString()}</h3>
                </div>
            </div>

            <div className="card-premium p-6 bg-white border-none shadow-xl">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o correo..."
                        className="input-field pl-14 h-16 text-lg font-black italic tracking-tight border-none bg-slate-50 shadow-inner"
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
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Sincronizando clientes...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No se encontraron clientes</td></tr>
                            ) : filtered.map((c) => (
                                <tr key={c.id || c._id} className="hover:bg-slate-50/50 transition-all group animate-fade-in">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-lg italic uppercase">
                                                {c.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg uppercase italic tracking-tighter leading-none">{c.name}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-slate-300" />
                                                    <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{c.address || 'Sin dirección'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Smartphone className="w-3.5 h-3.5 text-primary-400" />
                                                {c.phone || '---'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <Mail className="w-3.5 h-3.5 text-primary-300" />
                                                {c.email || '---'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="font-black text-slate-900 text-lg italic tracking-tighter">${(c.totalBought || 0).toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic font-bold">Historial de Ventas</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-sm ${(c.debts || 0) > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {(c.debts || 0) > 0 ? `DEBE $${c.debts.toLocaleString()}` : 'AL DÍA'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => handleEdit(c)}
                                                className="p-3 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-primary-600 hover:scale-110 transition-all border border-slate-50"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c)}
                                                className="p-3 bg-white shadow-xl rounded-2xl text-red-200 hover:text-red-500 hover:scale-110 transition-all border border-slate-50"
                                            >
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

            {/* Modal de Cliente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                                    {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Información de contacto y facturación</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all">
                                <X className="w-6 h-6 text-slate-300" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="input-field h-14 font-bold"
                                    placeholder="Ej. Juan Perez"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="input-field h-14 font-bold"
                                        placeholder="809-000-0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="input-field h-14 font-bold"
                                        placeholder="correo@ejemplo.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                                <textarea
                                    className="input-field min-h-[100px] py-4 font-bold"
                                    placeholder="Calle, Número, Ciudad..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-14 font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all italic text-[10px]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] bg-primary-500 hover:bg-primary-400 text-white h-14 rounded-2xl shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingCustomer ? 'Actualizar Cliente' : 'Registrar Cliente')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
