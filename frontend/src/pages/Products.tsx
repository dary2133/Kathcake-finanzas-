import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    Image as ImageIcon,
    X,
    Loader2,
    Package,
    AlertCircle,
    TrendingUp,
    BarChart3,
    DollarSign,
    Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Product } from '../types';

const CATEGORIES = [
    { id: 'cake-pops', name: 'Cake Pops' },
    { id: 'pasteles', name: 'Pasteles' },
    { id: 'cupcakes', name: 'Cupcakes' },
    { id: 'galletas', name: 'Galletas' },
    { id: 'postres', name: 'Postres' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'personalizados', name: 'Personalizados' }
];

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        category: 'cake-pops',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 5,
        description: ''
    });

    const isDemo = localStorage.getItem('token') === 'demo-token-123';

    const fetchProducts = async () => {
        if (isDemo) return;
        try {
            setLoading(true);
            const res = await axios.get('/api/products', { params: { search } });
            setProducts(res.data.data);
        } catch (err) {
            toast.error('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isDemo) {
            // Solo cargar iniciales si no hay productos
            if (products.length === 0) {
                setProducts([
                    { _id: 'p1', name: 'Red Velvet Cake Pop', price: 25, cost: 8.5, stock: 45, minStock: 10, category: 'cake-pops', images: [], description: 'Delicioso pastel de terciopelo rojo.' },
                    { _id: 'p2', name: 'Pastel de Chocolate Premium', price: 450, cost: 180, stock: 5, minStock: 3, category: 'pasteles', images: [], description: 'Triple capa de chocolate belga.' },
                    { _id: 'p3', name: 'Cupcake de Vainilla', price: 35, cost: 12, stock: 12, minStock: 15, category: 'cupcakes', images: [], description: 'Con frosting de mantequilla.' }
                ]);
            }
            setLoading(false);
        } else {
            fetchProducts();
        }
    }, [isDemo]);

    useEffect(() => {
        if (!isDemo) {
            const timeoutId = setTimeout(() => {
                fetchProducts();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [search, isDemo]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('Optimizando imagen...');

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        // Reducimos a 600px para base64 (eficiente para DB)
                        const MAX_SIZE = 600;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height *= MAX_SIZE / width;
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width *= MAX_SIZE / height;
                                height = MAX_SIZE;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, width, height);

                        // Calidad 0.6 es perfecta para POS y ahorra mucho espacio
                        resolve(canvas.toDataURL('image/jpeg', 0.6));
                    };
                    img.onerror = reject;
                    img.src = ev.target?.result as string;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            setPreviewUrl(base64);
            // Guardamos el base64 directamente en un lugar accesible para el submit
            (window as any)._tempImageBase64 = base64;
            toast.success('Imagen lista', { id: toastId });

        } catch (error) {
            console.error('Error procesando imagen', error);
            toast.error('Error al procesar imagen', { id: toastId });
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price,
            cost: product.cost || 0,
            stock: product.stock,
            minStock: product.minStock || 5,
            description: product.description || ''
        });
        setPreviewUrl(product.images?.[0]?.url || null);
        (window as any)._tempImageBase64 = null;
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        if (isDemo) {
            setProducts(products.filter(p => p._id !== id));
            toast.success('Producto eliminado (Modo Demo)');
            return;
        }

        try {
            await axios.delete(`/api/products/${id}`);
            toast.success('Producto eliminado');
            fetchProducts();
        } catch (err) {
            toast.error('Error al eliminar producto');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const imageBase64 = (window as any)._tempImageBase64;

        if (isDemo) {
            if (editingProduct) {
                setProducts(products.map(p => p._id === editingProduct._id ? {
                    ...p, ...formData,
                    images: imageBase64 ? [{ url: imageBase64 }] : p.images
                } : p));
                toast.success('Producto actualizado (Modo Demo) ✨');
            } else {
                const newProduct: Product = {
                    _id: `p-${Date.now()}`, ...formData,
                    images: imageBase64 ? [{ url: imageBase64 }] : []
                };
                setProducts([newProduct, ...products]);
                toast.success('Producto creado (Modo Demo) ✨');
            }
            setIsModalOpen(false);
            resetForm();
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                imageBase64: imageBase64 || undefined
            };

            if (editingProduct) {
                await axios.put(`/api/products/${editingProduct._id}`, { data: JSON.stringify(payload) });
                toast.success('Producto actualizado ✨');
            } else {
                await axios.post('/api/products', { data: JSON.stringify(payload) });
                toast.success('Producto creado ✨');
            }

            setIsModalOpen(false);
            resetForm();
            fetchProducts();
        } catch (err: any) {
            console.error('Error saving product:', err);
            const msg = err.response?.data?.message || err.message || 'Error al guardar producto';
            toast.error(`Error: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', category: 'cake-pops', price: 0, cost: 0, stock: 0, minStock: 5, description: '' });
        setSelectedImage(null);
        setPreviewUrl(null);
        setEditingProduct(null);
    };

    const totalInInventory = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const totalCost = products.reduce((acc, p) => acc + ((p.cost || 0) * p.stock), 0);
    const potentialProfit = totalInInventory - totalCost;

    return (
        <div className="space-y-8 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Inventario Maestro</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1 italic">Control de stock, costos y rentabilidad en tiempo real</p>
                </div>
                <div className="flex gap-4">
                    <button
                        className="btn-secondary h-14 px-6 flex items-center gap-3 uppercase font-black tracking-widest text-[10px]"
                    >
                        <Zap className="w-4 h-4 text-primary-500" />
                        Catálogo Virtual
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="btn-primary h-14 px-8 shadow-xl shadow-primary-500/20 flex items-center gap-3 uppercase font-black tracking-widest text-[10px]"
                    >
                        <Plus className="w-5 h-5" />
                        Añadir Producto
                    </button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-premium p-6 border-l-4 border-primary-500 bg-gradient-to-br from-white to-primary-50/30">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-primary-100 rounded-2xl text-primary-600 shadow-inner">
                            <Package className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">Activo</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total en Stock</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">{products.reduce((a, b) => a + b.stock, 0)} <span className="text-sm font-bold text-slate-400">UNI</span></h3>
                    </div>
                </div>

                <div className="card-premium p-6 border-l-4 border-amber-500 bg-gradient-to-br from-white to-amber-50/30">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shadow-inner">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-widest">Inversión</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Costo Total</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">${totalCost.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="card-premium p-6 border-l-4 border-emerald-500 bg-gradient-to-br from-white to-emerald-50/30">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">Potencial</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ganancia Proyectada</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">${potentialProfit.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="card-premium p-6 border-l-4 border-red-500 bg-gradient-to-br from-white to-red-50/30">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-red-100 rounded-2xl text-red-600 shadow-inner">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-widest">Alerta</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Agotándose</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter">{products.filter(p => p.stock <= (p.minStock || 5)).length} <span className="text-sm font-bold text-slate-400">ART</span></h3>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o categoría..."
                        className="input-field pl-12 h-14 text-lg font-bold tracking-tight"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn-secondary h-14 px-6 flex items-center gap-3 uppercase font-black tracking-widest text-[10px]">
                    <Filter className="w-5 h-5" />
                    Filtrar por Categoría
                </button>
            </div>

            <div className="card-premium overflow-hidden border-none shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Producto</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Venta / Costo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center">Ganancia</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Existencia</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">Sincronizando inventario...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No hay coincidencias en tu menú</td></tr>
                            ) : products.map((product) => {
                                const profit = product.price - (product.cost || 0);
                                const profitMargin = product.cost ? (profit / product.cost) * 100 : 100;

                                return (
                                    <tr key={product._id} className="hover:bg-slate-50/50 transition-all group animate-fade-in">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-white shadow-xl rounded-[1.25rem] overflow-hidden flex items-center justify-center text-slate-200 border border-slate-100 p-1">
                                                    <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50">
                                                        {product.images?.[0]?.url ? (
                                                            <img src={product.images[0].url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : <ImageIcon className="w-6 h-6 opacity-20" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase italic tracking-tighter text-lg leading-tight">{product.name}</p>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                        {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="font-black text-slate-900 text-xl tracking-tighter italic leading-none">${product.price.toFixed(2)}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo: ${product.cost?.toFixed(2) || '0.00'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex flex-col items-center gap-1">
                                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest italic ${profit > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                    +${profit.toFixed(2)}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{profitMargin.toFixed(0)}% Rent.</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${product.stock > (product.minStock || 5) ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                                                    <span className="font-black text-slate-900 italic tracking-tighter text-lg">{product.stock} <small className="text-[10px] uppercase text-slate-400">Uni</small></span>
                                                </div>
                                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${product.stock > (product.minStock || 5) ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                                                        style={{ width: `${Math.min(100, (product.stock / (product.minStock ? product.minStock * 4 : 20)) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-3 bg-white shadow-xl rounded-2xl text-slate-400 hover:text-primary-600 hover:scale-110 transition-all border border-slate-50"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="p-3 bg-white shadow-xl rounded-2xl text-red-200 hover:text-red-500 hover:scale-110 transition-all border border-slate-50"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in border border-white/20">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/50">
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 italic">Detalles de producción y ventas</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-3xl transition-all group">
                                <X className="w-7 h-7 text-slate-300 group-hover:text-slate-600" />
                            </button>
                        </div>

                        <div className="p-12 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative group">
                                    <div className="w-48 h-48 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary-400 group-hover:bg-primary-50/30 shadow-inner p-2">
                                        <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-white shadow-inner flex items-center justify-center relative">
                                            {previewUrl ? (
                                                <img src={previewUrl} className="w-full h-full object-cover animate-fade-in" />
                                            ) : (
                                                <ImageIcon className="w-16 h-16 text-slate-200" />
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-4 rounded-3xl shadow-2xl transform group-hover:scale-110 group-hover:bg-primary-500 transition-all pointer-events-none">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Click en el cuadro para subir imagen del postre</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre del Producto</label>
                                    <input
                                        required
                                        type="text"
                                        className="input-field h-16 font-black text-xl italic tracking-tighter uppercase"
                                        placeholder="Ej. Red Velvet Pop"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Ubicación / Categoría</label>
                                    <select
                                        className="input-field h-16 font-black uppercase tracking-widest text-xs appearance-none bg-slate-50 cursor-pointer"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 border-t border-slate-50">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1 italic">Precio al Cliente</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">$</span>
                                        <input
                                            required
                                            type="number"
                                            className="input-field h-16 pl-12 font-black text-2xl tracking-tighter"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 italic">Costo de Insumos (Producción)</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">$</span>
                                        <input
                                            required
                                            type="number"
                                            className="input-field h-16 pl-12 font-black text-2xl tracking-tighter bg-amber-50/20"
                                            value={formData.cost}
                                            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Existencia Inicial</label>
                                    <input
                                        required
                                        type="number"
                                        className="input-field h-16 font-black text-2xl tracking-tighter"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 italic">Punto de Reorden (Mínimo)</label>
                                    <input
                                        required
                                        type="number"
                                        className="input-field h-16 font-black text-2xl tracking-tighter bg-red-50/10 border-red-100"
                                        value={formData.minStock}
                                        onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Descripción / Notas de Decoración</label>
                                <textarea
                                    className="input-field min-h-[140px] py-6 font-medium text-lg leading-relaxed"
                                    placeholder="Detalles sobre ingredientes, alérgenos o decoración personalizada..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
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
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <Zap className="w-5 h-5 fill-white" />
                                        {editingProduct ? 'Actualizar Producto' : 'Lanzar al Menú'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
