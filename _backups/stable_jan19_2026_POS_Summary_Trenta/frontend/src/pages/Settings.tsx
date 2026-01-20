import { useState } from 'react';
import {
    Settings as SettingsIcon,
    DollarSign,
    Percent,
    Store,
    Globe,
    Bell,
    Shield,
    Save,
    RotateCcw,
    MapPin,
    Layers,
    Plus,
    Edit2,
    Trash2,
    Check,
    X
} from 'lucide-react';
import axios from 'axios';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Settings() {
    const [settings, setSettings] = useState({
        businessName: 'Kathcake POS',
        country: 'República Dominicana',
        currency: 'DOP',
        currencySymbol: 'RD$',
        taxRate: 18,
        address: 'Santo Domingo, República Dominicana',
        phone: '+1 829 531 2107',
        email: 'contacto@kathcake.com',
        lowStockAlert: 5,
        language: 'es',
        timezone: '(GMT-04:00) Santo Domingo',
        notifications: {
            lowStock: true,
            dailyReport: true,
            securityAlerts: true
        }
    });

    const [activeTab, setActiveTab] = useState('profile');
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const fetchCategories = async () => {
        try {
            setIsLoadingCategories(true);
            const res = await axios.get('/api/categories');
            setCategories(res.data.data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
            // toast.error('Error al cargar categorías');
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            if (res.data.success && res.data.data) {
                setSettings(prev => ({
                    ...prev,
                    ...res.data.data,
                    notifications: res.data.data.notifications || prev.notifications
                }));
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (activeTab === 'categories') {
            fetchCategories();
        }
    }, [activeTab]);

    const handleAddCategory = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            setIsAddingCategory(true);
            await axios.post('/api/categories', { name: newCategory });
            setNewCategory('');
            fetchCategories();
            toast.success('Categoría agregada ✨');
        } catch (err: any) {
            console.error('Error adding category:', err);
            const msg = err.response?.data?.message || 'Error al conectar con el servidor';
            toast.error(msg);
        } finally {
            setIsAddingCategory(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editingCategory.name.trim()) return;
        try {
            await axios.put(`/api/categories/${editingCategory.id}`, { name: editingCategory.name });
            setEditingCategory(null);
            fetchCategories();
            toast.success('Categoría actualizada');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al actualizar');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
        try {
            await axios.delete(`/api/categories/${id}`);
            fetchCategories();
            toast.success('Categoría eliminada');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await axios.post('/api/settings', settings);
            toast.success('Configuración guardada en la base de datos ✨');
        } catch (err: any) {
            console.error('Error saving settings:', err);
            toast.error(err.response?.data?.message || 'Error al guardar configuración');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Ajustes Globales</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 italic">Personaliza tu entorno de trabajo para {settings.country}</p>
                </div>
                <div className="flex gap-4">
                    <button className="btn-secondary h-14 px-8 flex items-center gap-3 uppercase font-black tracking-widest text-[10px] transition-all">
                        <RotateCcw className="w-5 h-5" />
                        Restablecer
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn-primary h-14 px-10 shadow-xl shadow-primary-500/20 flex items-center gap-3 uppercase font-black tracking-widest text-[10px] transition-all"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : <Save className="w-5 h-5" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Navigation/Tabs */}
                <div className="lg:col-span-1 space-y-4">
                    {[
                        { icon: Store, label: 'Perfil de Negocio', id: 'profile' },
                        { icon: Layers, label: 'Categorías', id: 'categories' },
                        { icon: DollarSign, label: 'Moneda y Finanzas', id: 'finance' },
                        { icon: Globe, label: 'Región e Idioma', id: 'region' },
                        { icon: Bell, label: 'Notificaciones', id: 'notifications' },
                        { icon: Shield, label: 'Seguridad y Accesos', id: 'security' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 p-6 rounded-3xl transition-all border-2 ${activeTab === tab.id
                                ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20'
                                : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-primary-500' : 'text-slate-300'}`} />
                            <span className="font-black uppercase tracking-widest text-[11px]">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right Column: Settings Form */}
                <div className="lg:col-span-2 space-y-10">
                    {activeTab === 'profile' && (
                        <div className="card-premium p-12 space-y-10 border-none shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Store className="w-32 h-32" />
                            </div>
                            <div className="flex items-center gap-4 pb-8 border-b border-slate-50 relative z-10">
                                <div className="p-4 bg-primary-50 rounded-2xl text-primary-600 shadow-inner">
                                    <Store className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                        Perfil del Negocio
                                        <Edit2 className="w-5 h-5 text-primary-500 animate-pulse" />
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Edita los campos directamente haciendo clic en ellos</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre de la Empresa</label>
                                    <input
                                        type="text"
                                        className="input-field h-16 font-bold text-lg text-slate-900 border-slate-100 hover:border-primary-200 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
                                        value={settings.businessName}
                                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">E-mail Corporativo</label>
                                    <input
                                        type="email"
                                        className="input-field h-16 font-bold text-sm text-slate-900 border-slate-100 hover:border-primary-200 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
                                        value={settings.email}
                                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">País de Operación</label>
                                    <select
                                        className="input-field h-16 font-bold uppercase tracking-widest text-xs appearance-none bg-slate-50 text-slate-900 border-slate-100 hover:border-primary-200 focus:border-primary-500 transition-all"
                                        value={settings.country}
                                        onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                                    >
                                        <option className="text-slate-900 bg-white font-bold">República Dominicana</option>
                                        <option className="text-slate-900 bg-white font-bold">México</option>
                                        <option className="text-slate-900 bg-white font-bold">Colombia</option>
                                        <option className="text-slate-900 bg-white font-bold">Estados Unidos</option>
                                        <option className="text-slate-900 bg-white font-bold">España</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Teléfono / WhatsApp</label>
                                    <input
                                        type="tel"
                                        className="input-field h-16 font-bold text-lg text-slate-900 border-slate-100 hover:border-primary-200 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
                                        value={settings.phone}
                                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Dirección Principal</label>
                                <div className="relative">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        type="text"
                                        className="input-field h-16 pl-14 font-bold text-sm text-slate-900 border-slate-100 hover:border-primary-200 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
                                        value={settings.address}
                                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="card-premium p-12 space-y-10 border-none shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Layers className="w-32 h-32" />
                            </div>
                            <div className="flex items-center gap-4 pb-8 border-b border-slate-50 relative z-10">
                                <div className="p-4 bg-primary-50 rounded-2xl text-primary-600 shadow-inner">
                                    <Layers className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Gestión de Categorías</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Organiza tus productos por grupos</p>
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <form onSubmit={handleAddCategory} className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Layers className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            type="text"
                                            placeholder="Ej: Postres, Bebidas..."
                                            className="input-field h-16 pl-14 font-bold uppercase text-sm tracking-widest text-slate-900 border-slate-100 hover:border-primary-200 focus:border-primary-500 shadow-sm"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isAddingCategory}
                                        className="h-16 px-10 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary-500/20 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {isAddingCategory ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <Plus className="w-5 h-5" />
                                        )}
                                        Agregar
                                    </button>
                                </form>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {isLoadingCategories ? (
                                        <div className="col-span-2 py-10 flex justify-center">
                                            <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="col-span-2 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay categorías registradas</div>
                                    ) : (
                                        categories.map((cat) => (
                                            <div key={cat.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                                                {editingCategory?.id === cat.id ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            className="flex-1 bg-white border-2 border-primary-500 rounded-xl px-4 py-2 font-black uppercase text-xs"
                                                            value={editingCategory.name}
                                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleUpdateCategory()}
                                                        />
                                                        <button onClick={handleUpdateCategory} className="p-2 bg-emerald-500 text-white rounded-xl"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => setEditingCategory(null)} className="p-2 bg-red-500 text-white rounded-xl"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="font-black uppercase tracking-widest text-xs italic">{cat.name}</span>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => setEditingCategory(cat)} className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div className="card-premium p-12 space-y-10 border-none shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <DollarSign className="w-32 h-32" />
                            </div>
                            <div className="flex items-center gap-4 pb-8 border-b border-slate-50 relative z-10">
                                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner">
                                    <DollarSign className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Moneda e Impuestos</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuración local de divisas</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Divisa Local</label>
                                    <select
                                        className="input-field h-16 font-black appearance-none bg-slate-50 uppercase tracking-widest text-xs text-slate-900"
                                        value={settings.currency}
                                        onChange={(e) => {
                                            const mapping: any = {
                                                DOP: 'RD$', MXN: '$', USD: '$', EUR: '€',
                                                COP: '$', ARS: '$', CLP: '$', PEN: 'S/',
                                                BRL: 'R$', GBP: '£', JPY: '¥'
                                            };
                                            setSettings({ ...settings, currency: e.target.value, currencySymbol: mapping[e.target.value] || '$' });
                                        }}
                                    >
                                        <option value="DOP" className="text-slate-900 bg-white">DOP - Peso Dominicano</option>
                                        <option value="USD" className="text-slate-900 bg-white">USD - Dólar Americano</option>
                                        <option value="EUR" className="text-slate-900 bg-white">EUR - Euro</option>
                                        <option value="MXN" className="text-slate-900 bg-white">MXN - Peso Mexicano</option>
                                        <option value="COP" className="text-slate-900 bg-white">COP - Peso Colombiano</option>
                                        <option value="ARS" className="text-slate-900 bg-white">ARS - Peso Argentino</option>
                                        <option value="CLP" className="text-slate-900 bg-white">CLP - Peso Chileno</option>
                                        <option value="PEN" className="text-slate-900 bg-white">PEN - Sol Peruano</option>
                                        <option value="BRL" className="text-slate-900 bg-white">BRL - Real Brasileño</option>
                                        <option value="GBP" className="text-slate-900 bg-white">GBP - Libra Esterlina</option>
                                        <option value="JPY" className="text-slate-900 bg-white">JPY - Yen Japonés</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Símbolo</label>
                                    <input
                                        type="text"
                                        className="input-field h-16 font-black text-center text-2xl italic tracking-tighter"
                                        value={settings.currencySymbol}
                                        onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">ITBIS / IVA (%)</label>
                                    <div className="relative">
                                        <Percent className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            type="number"
                                            className="input-field h-16 font-black text-2xl italic tracking-tighter"
                                            value={settings.taxRate}
                                            onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'region' && (
                        <div className="card-premium p-12 space-y-10 border-none shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Globe className="w-32 h-32" />
                            </div>
                            <div className="flex items-center gap-4 pb-8 border-b border-slate-50 relative z-10">
                                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shadow-inner">
                                    <Globe className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Región e Idioma</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Localización del sistema</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Idioma de la Interfaz</label>
                                    <select
                                        className="input-field h-16 font-black uppercase text-xs appearance-none bg-slate-50 text-slate-900"
                                        value={settings.language}
                                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                    >
                                        <option value="es" className="text-slate-900 bg-white">Español (Latinoamérica)</option>
                                        <option value="en" className="text-slate-900 bg-white">English (United States)</option>
                                        <option value="fr" className="text-slate-900 bg-white">Français</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Zona Horaria</label>
                                    <select
                                        className="input-field h-16 font-black uppercase text-xs appearance-none bg-slate-50 text-slate-900"
                                        value={settings.timezone}
                                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                    >
                                        <option className="text-slate-900">(GMT-04:00) Santo Domingo</option>
                                        <option className="text-slate-900">(GMT-06:00) Ciudad de México</option>
                                        <option className="text-slate-900">(GMT-05:00) Bogotá / Lima</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="card-premium p-12 space-y-10 border-none shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Bell className="w-32 h-32" />
                            </div>
                            <div className="flex items-center gap-4 pb-8 border-b border-slate-50 relative z-10">
                                <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 shadow-inner">
                                    <Bell className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Alertas y Notificaciones</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configura tus avisos de stock y ventas</p>
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                {[
                                    { id: 'lowStock', label: 'Notificar Stock Bajo', desc: 'Aviso cuando los productos lleguen al mínimo' },
                                    { id: 'dailyReport', label: 'Reporte Diario de Ventas', desc: 'Recibir resumen al cierre de caja' },
                                    { id: 'securityAlerts', label: 'Alertas de Seguridad', desc: 'Avisar sobre inicios de sesión inusuales' }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                                        <div>
                                            <p className="font-black uppercase tracking-tight text-sm italic">{item.label}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.desc}</p>
                                        </div>
                                        <div
                                            onClick={() => setSettings({
                                                ...settings,
                                                notifications: {
                                                    ...settings.notifications,
                                                    [item.id]: !((settings.notifications as any)[item.id])
                                                }
                                            })}
                                            className={`w-14 h-8 rounded-full relative cursor-pointer transition-all p-1 ${(settings.notifications as any)[item.id] ? 'bg-primary-500' : 'bg-slate-200'
                                                }`}
                                        >
                                            <div className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-all ${(settings.notifications as any)[item.id] ? 'right-1' : 'left-1'
                                                }`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="card-premium p-12 space-y-10 border-none shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Shield className="w-32 h-32" />
                            </div>
                            <div className="flex items-center gap-4 pb-8 border-b border-slate-50 relative z-10">
                                <div className="p-4 bg-red-50 rounded-2xl text-red-600 shadow-inner">
                                    <Shield className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Seguridad y Accesos</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Protección de datos y permisos</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <button className="p-8 bg-slate-900 text-white rounded-[2rem] text-left group hover:scale-[1.02] transition-all">
                                    <Shield className="w-8 h-8 text-primary-500 mb-4" />
                                    <p className="font-black uppercase tracking-widest text-xs italic">Cambiar Contraseña Maestra</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Último cambio: hace 15 días</p>
                                </button>
                                <button className="p-8 bg-white border-2 border-slate-100 rounded-[2rem] text-left group hover:bg-slate-50 transition-all">
                                    <Shield className="w-8 h-8 text-slate-300 mb-4" />
                                    <p className="font-black uppercase tracking-widest text-xs italic text-slate-900">Autenticación en Dos Pasos (2FA)</p>
                                    <p className="text-[9px] text-emerald-500 font-bold uppercase mt-2 italic">Configurado y Activo</p>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
