import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    Banknote,
    CreditCard,
    Smartphone,
    Layers,
    X,
    PackagePlus,
    PlusCircle,
    ArrowUpRight,
    Lock,
    Unlock,
    ChefHat,
    ShoppingBasket,
    ScanLine,
    Info,
    Wallet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Product, CartItem } from '../types';
import PrintButton from '../components/printer/print-button';
import '../components/printer/printer-styles.css';

export default function POS() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'mixed'>('cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFreeSaleModalOpen, setIsFreeSaleModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isCashOpen, setIsCashOpen] = useState(true);
    const [completedSale, setCompletedSale] = useState<any>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);

    // Free Sale Form
    const [freeSaleData, setFreeSaleData] = useState({
        name: '',
        price: '',
        quantity: 1
    });

    const isDemo = localStorage.getItem('token') === 'demo-token-123';
    const currency = 'RD$';

    useEffect(() => {
        if (isDemo) {
            setProducts([
                { _id: 'p1', name: 'Agua Cool Heaven', price: 30, cost: 10, stock: 45, category: 'bebidas', images: [], minStock: 5 },
                { _id: 'p2', name: 'Bizcocho Red Velvet', price: 225, cost: 80, stock: 12, category: 'bizcochos', images: [], minStock: 2 },
                { _id: 'p3', name: 'Cheesecake de Chinola', price: 250, cost: 95, stock: 5, category: 'postres', images: [], minStock: 3 },
                { _id: 'p4', name: 'Galletas Chips', price: 100, cost: 35, stock: 30, category: 'bolleria', images: [], minStock: 5 },
                { _id: 'p5', name: 'Ponqué de Almendras', price: 100, cost: 40, stock: 8, category: 'reposteria', images: [], minStock: 2 },
                { _id: 'p6', name: 'Mousse de Limón', price: 150, cost: 55, stock: 15, category: 'postres', images: [], minStock: 5 }
            ]);
        } else {
            fetchProducts();
        }
    }, [category, search, isDemo]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products/search/quick', { params: { q: search, category } });
            setProducts(res.data.data);
        } catch (err) {
            if (!isDemo) toast.error('Error al cargar productos');
        }
    };

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item._id === product._id);
        if (existing) {
            setCart(cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const addFreeSaleToCart = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(freeSaleData.price);
        if (isNaN(price) || price <= 0 || !freeSaleData.name) {
            toast.error('Nombre y precio válidos requeridos');
            return;
        }

        const customItem: CartItem = {
            _id: `free-${Date.now()}`,
            name: `[LIBRE] ${freeSaleData.name}`,
            price: price,
            cost: 0,
            quantity: freeSaleData.quantity,
            category: 'custom',
            images: [],
            stock: 999
        };

        setCart([...cart, customItem]);
        toast.success('Venta libre añadida ✨');
        setIsFreeSaleModalOpen(false);
        setFreeSaleData({ name: '', price: '', quantity: 1 });
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (isSubmitting) return;

        // Validar que no haya items "libres" que no existen en BD (hasta que el backend lo soporte)
        // O simplemente enviarlos y dejar que el backend falle si no existen.
        // Pero para la demo, asumamos que solo productos reales se venden por ahora.
        const validItems = cart.filter(item => !item._id.startsWith('free-'));
        if (validItems.length !== cart.length) {
            toast.error('Por ahora solo se pueden procesar productos del inventario, no ventas libres.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                items: validItems.map(item => ({
                    product: item._id,
                    quantity: item.quantity,
                    unitPrice: item.price
                })),
                paymentMethod: 'cash', // TODO: Usar estado de método de pago cuando esté en la UI
                customer: { name: 'Cliente de Mostrador' }, // TODO: Integrar selección de clientes
                discount: 0,
                discountType: 'none'
            };

            const res = await axios.post('/api/sales', payload);

            if (res.data.success) {
                toast.success('¡Venta registrada exitosamente! 🧾✨');
                // Preparar datos para impresión (usando respuesta del servidor o datos locales como fallback)
                const saleForPrint = res.data.data || {
                    invoiceNumber: res.data.invoiceNumber || `VENTA-${Date.now()}`,
                    items: validItems.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    subtotal: subtotal,
                    tax: tax,
                    total: total,
                    discount: payload.discount,
                    customer: payload.customer
                };
                setCompletedSale(saleForPrint);
                setShowPrintModal(true);
                setCart([]);
            } else {
                throw new Error(res.data.message || 'Error al guardar');
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            const msg = error.response?.data?.message || error.message || 'Error al procesar la venta';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return (
        <div className="flex flex-col xl:flex-row gap-10 h-[calc(100vh-160px)] animate-fade-in text-slate-900 overflow-hidden">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col gap-8 min-w-0 h-full">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-80">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 font-black" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                className="input-field pl-14 h-14 text-sm font-bold bg-slate-50 border-none shadow-inner"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        <button
                            onClick={() => setIsCashOpen(!isCashOpen)}
                            className={`h-14 px-6 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[9px] transition-all border-2 ${isCashOpen ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                            {isCashOpen ? <Unlock className="w-4 h-4 text-primary-400" /> : <Lock className="w-4 h-4" />}
                            {isCashOpen ? 'Caja Abierta' : 'Caja Cerrada'}
                        </button>
                        <button
                            onClick={() => setIsFreeSaleModalOpen(true)}
                            className="h-14 px-6 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[9px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <PackagePlus className="w-5 h-5" />
                            Venta Libre
                        </button>
                        <button
                            onClick={() => setIsExpenseModalOpen(true)}
                            className="h-14 px-6 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[9px] bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Wallet className="w-5 h-5" />
                            Gasto
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                    {['', 'Bebidas', 'Bizcochos', 'Bolleria', 'Postres', 'Reposteria'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat.toLowerCase())}
                            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 whitespace-nowrap ${category === cat.toLowerCase()
                                ? 'bg-primary-600 border-primary-600 text-white shadow-2xl shadow-primary-500/30'
                                : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {cat === '' ? 'Todos' : cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-8 pr-4 pb-20 custom-scrollbar">
                    {products.map(product => (
                        <div key={product._id} className="group relative">
                            <button
                                onClick={() => addToCart(product)}
                                className="w-full card-premium p-6 flex flex-col gap-5 border-none shadow-xl hover:shadow-2xl transition-all h-full bg-white active:scale-95 text-left overflow-hidden ring-0 hover:ring-2 hover:ring-primary-500/20"
                            >
                                <div className="absolute top-4 right-4 z-10">
                                    <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white font-black italic text-lg tracking-tighter shadow-2xl">
                                        {currency}{product.price}
                                    </div>
                                </div>
                                <div className="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100/50 flex items-center justify-center relative group-hover:bg-primary-50 transition-colors">
                                    <ChefHat className="w-20 h-20 text-slate-100 group-hover:text-primary-100 transition-colors absolute" />
                                    {product.images?.[0]?.url && <img src={product.images[0].url} className="w-full h-full object-cover relative z-[1] group-hover:scale-110 transition-transform duration-700" alt={product.name} />}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg uppercase italic tracking-tighter leading-tight group-hover:text-primary-600 transition-all">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-4">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En mostrador</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${product.stock > 10 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {product.stock} DISPONIBLES
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-inner group-hover:shadow-lg group-hover:shadow-primary-500/20 group-hover:rotate-12">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    ))}
                    {/* Add Product Shortcut Card */}
                    <button className="card-premium border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-primary-300 hover:text-primary-500 hover:bg-white transition-all order-first cursor-pointer group p-10">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                            <PlusCircle className="w-8 h-8" />
                        </div>
                        <span className="font-black uppercase tracking-widest text-[9px] italic">Crear Producto</span>
                    </button>
                </div>
            </div>

            {/* Right: Cart/Checkout */}
            <div className="w-full xl:w-[500px] h-full flex flex-col gap-6 bg-white rounded-[3rem] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                <div className="p-10 pb-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Canasta</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 flex items-center gap-2 italic">
                                <ScanLine className="w-3 h-3 text-primary-500" />
                                Lista de Entrega
                            </p>
                        </div>
                        <button
                            onClick={() => setCart([])}
                            className="text-[9px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            Vaciar Carrito
                            <Trash2 className="w-4 h-4 opacity-50" />
                        </button>
                    </div>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-10 space-y-8 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-6">
                            <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center scale-110">
                                <ShoppingBasket className="w-16 h-16 text-slate-300" />
                            </div>
                            <div>
                                <p className="font-black text-2xl text-slate-400 uppercase italic tracking-tighter">Sin pedidos aún</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Usa el lector o selecciona productos</p>
                            </div>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item._id} className="flex gap-6 animate-slide-up group">
                                <div className="w-20 h-20 bg-slate-50 rounded-[1.25rem] overflow-hidden shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                                    {item.images?.[0]?.url ? (
                                        <img src={item.images[0].url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <ChefHat className="w-8 h-8 opacity-20" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 uppercase italic tracking-tighter leading-tight truncate">{item.name}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center bg-slate-50 p-1 rounded-xl">
                                            <button onClick={() => {
                                                const newQty = item.quantity - 1;
                                                if (newQty === 0) setCart(cart.filter(i => i._id !== item._id));
                                                else setCart(cart.map(i => i._id === item._id ? { ...i, quantity: newQty } : i));
                                            }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition-all"><Minus className="w-3 h-3" /></button>
                                            <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                                            <button onClick={() => setCart(cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition-all"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <p className="text-xs font-black text-primary-500 italic">{currency}{item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-xl tracking-tighter italic leading-none">{currency}{(item.price * item.quantity).toFixed(2)}</p>
                                    <button onClick={() => setCart(cart.filter(i => i._id !== item._id))} className="text-[9px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest mt-4">Eliminar</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals & Pay */}
                <div className="p-10 mt-auto bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 to-accent-500"></div>

                    <div className="grid grid-cols-2 gap-x-10 gap-y-6 mb-10">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Subtotal Bruto</p>
                            <p className="text-2xl font-black text-white italic tracking-tighter mt-1">{currency}{subtotal.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-right">ITBIS (18%)</p>
                            <p className="text-2xl font-black text-white italic tracking-tighter mt-1 text-right">{currency}{tax.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] italic mb-1">Monto Total</span>
                            <h3 className="text-6xl font-black text-white italic tracking-tighter leading-none">{currency}{total.toLocaleString()}</h3>
                        </div>
                        <div className="w-px h-16 bg-slate-800"></div>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="p-4 bg-slate-800 rounded-2xl text-slate-400 border border-slate-700 group-hover:border-primary-500 group-hover:text-primary-500 transition-all">
                                <Info className="w-6 h-6" />
                            </div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Detalles</span>
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || isSubmitting}
                            className="flex-[3] h-20 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Continuar Venta
                                    <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isFreeSaleModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsFreeSaleModalOpen(false)}></div>
                    <form onSubmit={addFreeSaleToCart} className="relative bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_50px_150px_-20px_rgba(0,0,0,0.5)] animate-scale-in">
                        <div className="p-12 pb-6 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/50">
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Nueva Venta Libre</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 italic">Item no registrado / Adelanto de Pedido</p>
                            </div>
                            <button type="button" onClick={() => setIsFreeSaleModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-3xl transition-all"><X className="w-8 h-8 text-slate-300" /></button>
                        </div>
                        <div className="p-12 space-y-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Concepto de la Venta</label>
                                <div className="relative">
                                    <ChefHat className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input
                                        required
                                        className="input-field h-16 pl-14 font-black text-xl italic tracking-tighter uppercase"
                                        placeholder="Ej. Diseño Personalizado..."
                                        value={freeSaleData.name}
                                        onChange={e => setFreeSaleData({ ...freeSaleData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Monto ({currency})</label>
                                    <input
                                        required
                                        type="number"
                                        className="input-field h-16 font-black text-2xl italic tracking-tighter"
                                        placeholder="0.00"
                                        value={freeSaleData.price}
                                        onChange={e => setFreeSaleData({ ...freeSaleData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Cant.</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        className="input-field h-16 font-black text-2xl italic tracking-tighter text-center"
                                        value={freeSaleData.quantity}
                                        onChange={e => setFreeSaleData({ ...freeSaleData, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-12 bg-slate-900 flex gap-6">
                            <button type="button" onClick={() => setIsFreeSaleModalOpen(false)} className="flex-1 h-20 font-black uppercase text-slate-500 italic text-sm">Descartar</button>
                            <button type="submit" className="flex-[3] h-20 bg-primary-600 hover:bg-primary-500 text-white rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary-500/20 active:scale-[0.98] transition-all">Añadir a la Canasta</button>
                        </div>
                    </form>
                </div>
            )}
            {/* Print Modal */}
            {showPrintModal && completedSale && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
                    <div className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-fade-in flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                            <ChefHat className="w-10 h-10 text-emerald-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 italic uppercase">¡Venta Exitosa!</h3>
                            <p className="text-slate-500 font-medium">La transacción se ha procesado correctamente.</p>
                        </div>

                        <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Cobrado</span>
                                <span className="text-xl font-black text-slate-900">{currency}{completedSale.total?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cambio</span>
                                <span className="text-sm font-bold text-slate-900">{currency}0.00</span>
                            </div>
                        </div>

                        <div className="w-full">
                            <PrintButton
                                saleData={completedSale}
                                companyInfo={{
                                    name: "Kathcake",
                                    address: "Santo Domingo",
                                    phone: "809-555-0123",
                                    footerMessage: "¡Gracias por preferirnos!"
                                }}
                                onPrintComplete={(result: any) => {
                                    console.log('Print result:', result);
                                    // Opcional: Cerrar modal automáticamente
                                }}
                            />
                        </div>

                        <button
                            onClick={() => setShowPrintModal(false)}
                            className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                        >
                            Cerrar y Nueva Venta
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = `
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`;
