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
    MapPin
} from 'lucide-react';
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
        language: 'es'
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success('Configuración guardada exitosamente ✨');
        }, 1200);
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
                        { icon: Store, label: 'Perfil de Negocio', active: true },
                        { icon: DollarSign, label: 'Moneda y Finanzas', active: false },
                        { icon: Globe, label: 'Región e Idioma', active: false },
                        { icon: Bell, label: 'Notificaciones', active: false },
                        { icon: Shield, label: 'Seguridad y Accesos', active: false },
                    ].map((tab, i) => (
                        <button
                            key={i}
                            className={`w-full flex items-center gap-4 p-6 rounded-3xl transition-all border-2 ${tab.active
                                ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20'
                                : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <tab.icon className={`w-6 h-6 ${tab.active ? 'text-primary-500' : 'text-slate-300'}`} />
                            <span className="font-black uppercase tracking-widest text-[11px]">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right Column: Settings Form */}
                <div className="lg:col-span-2 space-y-10">
                    {/* General Section */}
                    <div className="card-premium p-12 space-y-10 border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Store className="w-32 h-32" />
                        </div>
                        <div className="flex items-center gap-4 pb-8 border-b border-slate-50 relative z-10">
                            <div className="p-4 bg-primary-50 rounded-2xl text-primary-600 shadow-inner">
                                <Store className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Perfil del Negocio</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Identidad de tu repostería gourmet</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre de la Empresa</label>
                                <input
                                    type="text"
                                    className="input-field h-16 font-black text-xl italic tracking-tighter uppercase"
                                    value={settings.businessName}
                                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">E-mail Corporativo</label>
                                <input
                                    type="email"
                                    className="input-field h-16 font-black text-xs uppercase"
                                    value={settings.email}
                                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">País de Operación</label>
                                <select
                                    className="input-field h-16 font-black uppercase tracking-widest text-xs appearance-none bg-slate-50"
                                    value={settings.country}
                                    onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                                >
                                    <option>República Dominicana</option>
                                    <option>México</option>
                                    <option>Colombia</option>
                                    <option>Estados Unidos</option>
                                    <option>España</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Teléfono / WhatsApp</label>
                                <input
                                    type="tel"
                                    className="input-field h-16 font-black text-xl italic"
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
                                    className="input-field h-16 pl-14 font-bold text-sm"
                                    value={settings.address}
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Finance Section */}
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
                            <div className="space-y-3 text-white">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic text-slate-400">Divisa Local</label>
                                <select
                                    className="input-field h-16 font-black appearance-none bg-slate-50 uppercase tracking-widest text-xs"
                                    value={settings.currency}
                                    onChange={(e) => {
                                        const mapping: any = { DOP: 'RD$', MXN: '$', USD: '$', EUR: '€', COP: '$' };
                                        setSettings({ ...settings, currency: e.target.value, currencySymbol: mapping[e.target.value] || '$' });
                                    }}
                                >
                                    <option value="DOP">DOP - Peso Dominicano</option>
                                    <option value="MXN">MXN - Peso Mexicano</option>
                                    <option value="USD">USD - Dólar Americano</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="COP">COP - Peso Colombiano</option>
                                </select>
                            </div>
                            <div className="space-y-3 text-white">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic text-slate-400">Símbolo</label>
                                <input
                                    type="text"
                                    className="input-field h-16 font-black text-center text-2xl italic tracking-tighter"
                                    value={settings.currencySymbol}
                                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3 text-white">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic text-slate-400">ITBIS / IVA (%)</label>
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
                </div>
            </div>
        </div>
    );
}
