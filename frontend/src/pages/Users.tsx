import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    UserPlus,
    Search,
    Mail,
    Phone,
    Shield,
    Edit3,
    Trash2,
    User as UserIcon,
    X,
    Lock,
    Loader2,
    Circle,
    Smartphone,
    ShoppingBag,
    Package,
    LineChart,
    Users2,
    Truck,
    Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { User } from '../types';

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'seller',
        phone: '',
        permissions: {
            pos: true,
            movements: false,
            inventory: false,
            customers: false,
            suppliers: false,
            settings: false
        }
    });

    const isDemo = localStorage.getItem('token') === 'demo-token-123';

    useEffect(() => {
        if (isDemo) {
            setUsers([
                { _id: 'demo-1', name: 'Katherine', email: 'kat@kathcake.com', role: 'admin', phone: '+18295312107', isActive: true, permissions: {} },
                { _id: 'demo-2', name: 'Krisbel', email: 'krisbel@kathcake.com', role: 'seller', phone: '+18493853946', isActive: true, permissions: {} },
                { _id: 'demo-3', name: 'Jose', email: 'jose@kathcake.com', role: 'seller', phone: '+18256403091', isActive: true, permissions: {} }
            ]);
            setLoading(false);
        } else {
            fetchUsers();
        }
    }, [isDemo]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err: any) {
            if (!isDemo) toast.error('Error al cargar personal');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);

        // Normalizar permisos para asegurar que todos los checkboxes se muestren correctamente
        const defaultPermissions = {
            pos: false,
            movements: false,
            inventory: false,
            customers: false,
            suppliers: false,
            settings: false
        };

        const currentPermissions = user.permissions && typeof user.permissions === 'object'
            ? { ...user.permissions }
            : {};

        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            phone: user.phone || '',
            permissions: {
                ...defaultPermissions,
                ...currentPermissions
            }
        });
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar a este miembro del equipo?')) return;

        if (isDemo) {
            setUsers(users.filter(u => u._id !== id));
            toast.success('Miembro eliminado (Modo Demo)');
            return;
        }

        try {
            await axios.delete(`/api/users/${id}`);
            toast.success('Miembro eliminado exitosamente');
            fetchUsers();
        } catch (err: any) {
            toast.error('Error al eliminar miembro');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (isDemo) {
            if (editingUser) {
                setUsers(users.map(u => u._id === editingUser._id ? {
                    ...u,
                    ...formData,
                    role: formData.role as 'admin' | 'seller'
                } : u));
                toast.success('Miembro actualizado ✨');
            } else {
                const newUser: User = {
                    _id: `demo-${Date.now()}`,
                    name: formData.name,
                    email: formData.email,
                    role: formData.role as 'admin' | 'seller',
                    phone: formData.phone,
                    isActive: true,
                    permissions: formData.permissions
                };
                setUsers([newUser, ...users]);
                toast.success('Miembro creado ✨');
            }
            setIsModalOpen(false);
            resetForm();
            setIsSubmitting(false);
            return;
        }

        try {
            if (editingUser) {
                await axios.put(`/api/users/${editingUser._id}`, formData);
                toast.success('Miembro actualizado exitosamente ✨');
            } else {
                await axios.post('/api/auth/register', formData);
                toast.success('Miembro creado exitosamente ✨');
            }
            setIsModalOpen(false);
            resetForm();
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al procesar solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'seller',
            phone: '',
            permissions: { pos: true, movements: false, inventory: false, customers: false, suppliers: false, settings: false }
        });
        setEditingUser(null);
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(search.toLowerCase())) ||
        (user.phone && user.phone.includes(search))
    );

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Equipo de Trabajo</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 italic">Control de accesos, roles y rendimiento del personal</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn-primary h-14 px-8 shadow-xl shadow-primary-500/20 flex items-center gap-3 uppercase font-black tracking-widest text-[10px]"
                >
                    <UserPlus className="w-5 h-5" />
                    Registrar Empleado
                </button>
            </div>

            <div className="card-premium p-6 border-none shadow-xl bg-white/50 backdrop-blur-sm">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o teléfono..."
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
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Nombre</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Celular</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Rol</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Accesos</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Estado</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Sincronizando equipo...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No hay miembros en el equipo</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50/50 transition-all group animate-fade-in">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center font-black text-lg italic shadow-lg shadow-primary-500/20">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg uppercase italic tracking-tighter leading-none">{user.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    {user.email || user.phone || 'Sin contacto'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 text-sm font-black text-slate-600 italic">
                                            <Smartphone className="w-4 h-4 text-primary-400" />
                                            {user.phone || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {user.role === 'admin' ? 'Propietario' : 'Vendedor'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {user.role === 'admin' ? (
                                                <div className="p-2 bg-purple-50 text-purple-500 rounded-xl" title="Acceso Total">
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <>
                                                    {(user.permissions?.pos || user.permissions?.canCreateSales) && (
                                                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl" title="Ventas">
                                                            <ShoppingBag className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    {(user.permissions?.inventory || user.permissions?.canManageInventory) && (
                                                        <div className="p-2 bg-blue-50 text-blue-500 rounded-xl" title="Inventario">
                                                            <Package className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    {(user.permissions?.movements || user.permissions?.canViewReports) && (
                                                        <div className="p-2 bg-amber-50 text-amber-500 rounded-xl" title="Movimientos">
                                                            <LineChart className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    {(user.permissions?.customers) && (
                                                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl" title="Clientes">
                                                            <Users2 className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    {(user.permissions?.settings || user.permissions?.canManageUsers) && (
                                                        <div className="p-2 bg-slate-100 text-slate-500 rounded-xl" title="Configuración">
                                                            <Settings className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    {(!user.permissions || Object.keys(user.permissions).length === 0) && (
                                                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Sin Accesos</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest italic bg-emerald-50 px-3 py-1 rounded-lg">
                                            <Circle className="w-2 h-2 fill-emerald-500" />
                                            Activo
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="p-3 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-primary-600 hover:scale-110 transition-all border border-slate-50"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user._id)}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in border border-white/20">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/50">
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">
                                    {editingUser ? 'Ficha de Empleado' : 'Nuevo Ingreso'}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 italic">Control de acceso y credenciales</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-3xl transition-all group">
                                <X className="w-7 h-7 text-slate-300 group-hover:text-slate-600" />
                            </button>
                        </div>

                        <div className="p-12 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        required
                                        type="text"
                                        className="input-field h-16 pl-14 font-black text-xl italic tracking-tighter uppercase"
                                        placeholder="Ej. Kat Cake"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            type="email"
                                            className="input-field h-16 pl-14 font-black text-xs uppercase"
                                            placeholder="kat@kathcake.com (Opcional)"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Celular</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            type="tel"
                                            className="input-field h-16 pl-14 font-black text-lg italic"
                                            placeholder="+1829..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Rol Asignado</label>
                                    <select
                                        className="input-field h-16 font-black uppercase tracking-widest text-xs appearance-none bg-slate-50 cursor-pointer"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="seller">Vendedor / Cajero</option>
                                        <option value="admin">Administrador / Propietario</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1 italic">PIN de Acceso</label>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            required={!editingUser}
                                            type="password"
                                            autoComplete="new-password"
                                            className="input-field h-16 pl-14 font-black text-xl italic tracking-widest"
                                            placeholder="••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Panel de Permisos */}
                            {formData.role !== 'admin' && (
                                <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic block mb-4">Paneles Autorizados</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'pos', label: 'Punto de Venta' },
                                            { id: 'movements', label: 'Movimientos' },
                                            { id: 'inventory', label: 'Inventario' },
                                            { id: 'customers', label: 'Clientes' },
                                            { id: 'suppliers', label: 'Proveedores' },
                                            { id: 'settings', label: 'Configuración' }
                                        ].map((perm) => (
                                            <label key={perm.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:border-primary-200 transition-all group">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-slate-200 text-primary-500 focus:ring-primary-500/20 transition-all cursor-pointer"
                                                    checked={(formData.permissions as any)[perm.id] || false}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        permissions: {
                                                            ...formData.permissions,
                                                            [perm.id]: e.target.checked
                                                        }
                                                    })}
                                                />
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-primary-600 transition-colors italic">
                                                    {perm.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-12 bg-slate-900 flex gap-8">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-20 font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all italic text-xs"
                            >
                                Descartar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[3] bg-primary-500 hover:bg-primary-400 text-white h-20 rounded-[1.75rem] shadow-2xl shadow-primary-500/30 flex items-center justify-center gap-4 font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : editingUser ? 'Actualizar Ficha' : 'Dar de Alta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
