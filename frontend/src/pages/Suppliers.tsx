import { useState, useEffect } from 'react';
import axios from 'axios';
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
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Supplier {
    id: string;
    _id?: string;
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        contact: '',
        phone: '',
        email: ''
    });

    const categories = ['Leche y Cremas', 'Materias Primas', 'Envases', 'Decoración', 'Maquinaria', 'Otros'];

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/suppliers');
            if (res.data.success) {
                setSuppliers(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching suppliers:', err);
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (editingSupplier) {
                const id = editingSupplier.id || editingSupplier._id;
                await axios.put(`/api/suppliers/${id}`, formData);
                toast.success('Proveedor actualizado ✨');
            } else {
                await axios.post('/api/suppliers', formData);
                toast.success('Proveedor registrado ✨');
            }
            setIsModalOpen(false);
            resetForm();
            fetchSuppliers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al guardar proveedor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (supplier: Supplier) => {
        const id = supplier.id || supplier._id;
        if (!confirm(`¿Estás seguro de eliminar el proveedor ${supplier.name}?`)) return;
        try {
            await axios.delete(`/api/suppliers/${id}`);
            toast.success('Proveedor eliminado');
            fetchSuppliers();
        } catch (err) {
            toast.error('Error al eliminar proveedor');
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            category: supplier.category,
            contact: supplier.contact || '',
            phone: supplier.phone || '',
            email: supplier.email || ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ name: '', category: '', contact: '', phone: '', email: '' });
        setEditingSupplier(null);
    };

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        s.contact?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Proveedores Estratégicos</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 italic">Gestión de abastecimiento, compras y relaciones comerciales</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn-primary h-14 px-8 shadow-xl shadow-primary-500/20 flex items-center gap-3 uppercase font-black tracking-widest text-[10px]"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Proveedor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="card-premium p-6 border-l-4 border-primary-500 bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Proveedores Activos</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">{suppliers.length}</h3>
                </div>
                <div className="card-premium p-6 border-l-4 border-amber-500 bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Pendientes de Pago</p>
                    <h3 className="text-3xl font-black text-amber-600 mt-1 italic tracking-tighter">{suppliers.reduce((acc, s) => acc + (s.pendingOrders || 0), 0)} Órdenes</h3>
                </div>
            </div>

            <div className="card-premium p-6 bg-white border-none shadow-xl">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, categoría o contacto..."
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
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Proveedor</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Contacto</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Categoría</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Compras Totales</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Sincronizando proveedores...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No se encontraron proveedores</td></tr>
                            ) : filtered.map((s) => (
                                <tr key={s.id || s._id} className="hover:bg-slate-50/50 transition-all group animate-fade-in">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                                                <Truck className="w-6 h-6 opacity-30" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg uppercase italic tracking-tighter leading-none">{s.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PROVEEDOR</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-700 uppercase italic tracking-tighter">{s.contact || 'Sin contacto'}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <Smartphone className="w-3 h-3 text-primary-400" />
                                                {s.phone || '---'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black rounded-lg uppercase tracking-widest italic">
                                            {s.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="font-black text-slate-900 text-lg italic tracking-tighter">${(s.totalPurchased || 0).toLocaleString()}</p>
                                        <div className="flex items-center justify-center gap-1.5 mt-1">
                                            <Package className={`w-3 h-3 ${(s.pendingOrders || 0) > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-300'}`} />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{(s.pendingOrders || 0)} Pendientes</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => handleEdit(s)}
                                                className="p-3 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-primary-600 hover:scale-110 transition-all border border-slate-50"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s)}
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

            {/* Modal de Proveedor */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                                    {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Datos de abastecimiento y contacto</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all">
                                <X className="w-6 h-6 text-slate-300" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social / Nombre</label>
                                <input
                                    required
                                    type="text"
                                    className="input-field h-14 font-bold"
                                    placeholder="Ej. Distribuidora del Norte"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                    <select
                                        required
                                        className="input-field h-14 font-bold"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Persona de Contacto</label>
                                    <input
                                        type="text"
                                        className="input-field h-14 font-bold"
                                        placeholder="Nombre del vendedor"
                                        value={formData.contact}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo</label>
                                    <input
                                        type="email"
                                        className="input-field h-14 font-bold"
                                        placeholder="proveedor@ejemplo.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
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
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingSupplier ? 'Actualizar Proveedor' : 'Registrar Proveedor')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
