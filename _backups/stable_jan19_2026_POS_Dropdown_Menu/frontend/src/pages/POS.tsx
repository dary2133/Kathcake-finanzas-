import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    X,
    PackagePlus,
    PlusCircle,
    ArrowUpRight,
    Lock,
    Unlock,
    ChefHat,
    ShoppingBasket,
    ShoppingBag,
    ScanLine,
    Info,
    Wallet,
    CreditCard,
    Banknote,
    ArrowLeftRight,
    CheckCircle2,
    Printer,
    Download,
    User,
    Calendar,
    Receipt,
    Percent,
    ArrowLeft,
    ArrowRight,
    Calculator,
    AlertTriangle,
    Clipboard,
    Check,
    ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Product, CartItem } from '../types';

export default function POS() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFreeSaleModalOpen, setIsFreeSaleModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isCashOpen, setIsCashOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] = useState(false);
    const [initialCash, setInitialCash] = useState('');
    const [countedCash, setCountedCash] = useState('');
    const [registerStats, setRegisterStats] = useState({ cash: 0, card: 0, transfer: 0, other: 0, total: 0 });

    // Estados para el flujo de pago
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'card', 'transfer', 'other'
    const [saleStatus, setSaleStatus] = useState('paid'); // 'paid', 'credit'
    const [saleDate, setSaleDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [customerName, setCustomerName] = useState('Cliente de Mostrador');
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('none');
    const [numPayments, setNumPayments] = useState(1);
    const [receivedAmount, setReceivedAmount] = useState('');
    const [lastSale, setLastSale] = useState<any>(null);
    const [saleName, setSaleName] = useState('');
    const [categories, setCategories] = useState<any[]>([]);

    const [expenseForm, setExpenseForm] = useState({
        date: new Date().toLocaleDateString('en-CA'),
        category: '',
        amount: '',
        name: '',
        provider: '',
        paymentMethod: 'cash',
        status: 'paid'
    });

    const [freeSaleData, setFreeSaleData] = useState({
        name: '',
        price: '',
        quantity: 1
    });

    const currency = 'RD$';

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products/search/quick', { params: { q: search, category } });
            setProducts(res.data.data);
        } catch (err) {
            toast.error('Error al cargar productos');
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data.data.filter((c: any) => c.isActive));
        } catch (err) {
            console.error('Error al cargar categorías');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isRegisterDropdownOpen) {
                const target = event.target as HTMLElement;
                if (!target.closest('.register-dropdown-container')) {
                    setIsRegisterDropdownOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isRegisterDropdownOpen]);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        checkRegisterStatus();
    }, [category, search]);

    const checkRegisterStatus = async () => {
        try {
            const res = await axios.get('/api/cash-register/status');
            if (res.data.success && res.data.isOpen) {
                setIsCashOpen(true);
                if (res.data.data.initialCash) {
                    setInitialCash(res.data.data.initialCash.toString());
                }
            } else {
                setIsCashOpen(false);
            }
        } catch (err) {
            console.error('Error checking register status', err);
        }
    };

    const addToCart = (product: Product) => {
        if (!isCashOpen) {
            toast.error('⛔ La caja está cerrada. Debe abrirla para vender.');
            return;
        }
        const existing = cart.find(item => item._id === product._id);
        if (existing) {
            setCart(cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const handleOpenRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!initialCash || isNaN(parseFloat(initialCash))) {
            toast.error('Ingrese un monto válido');
            return;
        }

        try {
            const res = await axios.post('/api/cash-register/open', { initialCash: parseFloat(initialCash) });
            if (res.data.success) {
                setIsCashOpen(true);
                setIsRegisterModalOpen(false);
                toast.success(`Caja abierta con ${currency}${parseFloat(initialCash).toLocaleString()}`);
            }
        } catch (error: any) {
            console.error('Error opening register:', error);
            const msg = error.response?.data?.message || `Error ${error.response?.status || ''}: No se pudo abrir la caja`;
            toast.error(msg);
        }
    };

    const fetchRegisterStats = async () => {
        try {
            const res = await axios.get('/api/sales/daily-summary');
            if (res.data.success) {
                setRegisterStats(res.data.data);
            }
        } catch (error) {
            console.error('Error stats:', error);
            // Fallback en caso de error
        }
    };

    const toggleRegister = async () => {
        if (isCashOpen) {
            await fetchRegisterStats();
            setIsCloseRegisterModalOpen(true);
        } else {
            setIsRegisterModalOpen(true);
        }
    };

    const handleCloseRegister = async () => {
        const expected = parseFloat(initialCash || '0') + registerStats.cash;
        const counted = parseFloat(countedCash || '0');
        const diff = counted - expected;

        try {
            const res = await axios.post('/api/cash-register/close', {
                countedCash: counted,
                notes: `Diferencia: ${diff}`
            });

            if (res.data.success) {
                setIsCashOpen(false);
                setIsCloseRegisterModalOpen(false);
                setInitialCash('');
                setCountedCash('');
                setRegisterStats({ cash: 0, card: 0, transfer: 0, other: 0, total: 0 });
                toast.success('Caja cerrada correctamente');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al cerrar la caja');
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/movements', expenseForm);
            if (res.data.success) {
                toast.success('Gasto registrado exitosamente');
                setIsExpenseModalOpen(false);
                setExpenseForm({
                    date: new Date().toLocaleDateString('en-CA'),
                    category: '',
                    amount: '',
                    name: '',
                    provider: '',
                    paymentMethod: 'cash',
                    status: 'paid'
                });
            }
        } catch (err: any) {
            console.error('Error creating expense:', err);
            toast.error(err.response?.data?.message || 'Error al guardar el gasto');
        }
    };

    const addFreeSaleToCart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCashOpen) {
            toast.error('⛔ La caja está cerrada.');
            return;
        }
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

        setIsSubmitting(true);
        try {
            const saleItems = cart.map(item => ({
                product: item._id.toString().startsWith('free-') ? 'venta-libre' : item._id,
                productName: item.name,
                quantity: item.quantity,
                unitPrice: item.price
            }));

            // Si la fecha seleccionada coincide con la fecha actual (según el sistema), usamos la hora actual exacta
            // para evitar que la venta quede "antes" de la apertura de caja.
            const currentLocalDate = new Date().toLocaleDateString('en-CA');
            const saleDateTime = saleDate === currentLocalDate ? new Date() : new Date(saleDate);

            const payload = {
                items: saleItems,
                customer: { name: customerName || 'Cliente Genérico' },
                paymentMethod,
                discount: discount > 0 ? discount : undefined,
                discountType,
                status: saleStatus,
                createdAt: saleDateTime
            };

            console.log("Enviando venta:", payload); // Debug info

            const res = await axios.post('/api/sales', payload);

            if (res.data.success) {
                // Generar el nombre automático basado en los productos del carrito
                const itemsSummary = cart.map(item => `${item.quantity} ${item.name}`).join(', ');
                setSaleName(itemsSummary);

                setLastSale({ ...res.data.data, total });
                setCart([]);
                setIsPaymentModalOpen(false);
                setIsChangeModalOpen(false);
                setIsSuccessModalOpen(true);
                setReceivedAmount('');
                toast.success('¡Venta registrada!');

                // Actualizar info de la caja y productos
                fetchRegisterStats();
                fetchProducts();
            }
        } catch (error: any) {
            console.error('Error checkout:', error);
            toast.error(error.response?.data?.message || 'Error al procesar la venta');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handlePrint = () => {
        if (!lastSale) return;
        toast.success('Generando ticket para impresión...');
        setTimeout(() => window.print(), 500);
    };

    const handleDownload = () => {
        if (!lastSale) return;
        toast.success('Preparando descarga de PDF...');
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return (
        <div className="flex flex-col xl:flex-row gap-10 h-[calc(100vh-160px)] animate-fade-in text-slate-900 overflow-hidden">
            <div className="flex-1 flex flex-col gap-8 min-w-0 h-full">
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
                        <div className="relative register-dropdown-container">
                            <button
                                onClick={() => setIsRegisterDropdownOpen(!isRegisterDropdownOpen)}
                                className={`h-14 px-6 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[9px] transition-all border-2 ${isCashOpen ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'}`}
                            >
                                {isCashOpen ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
                                {isCashOpen ? 'Caja Abierta' : 'Caja Cerrada'}
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isRegisterDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isRegisterDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[1.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
                                    <div className="px-5 pb-3 mb-2 border-b border-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gestión de caja</p>
                                    </div>
                                    {isCashOpen ? (
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={async () => {
                                                    setIsRegisterDropdownOpen(false);
                                                    await fetchRegisterStats();
                                                    setIsCloseRegisterModalOpen(true);
                                                }}
                                                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-slate-700 group text-left"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                                    <Lock className="w-4 h-4 text-red-500" />
                                                </div>
                                                <div className="flex flex-col leading-tight">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Cerrar caja</span>
                                                    <span className="text-[9px] font-medium text-slate-400">Finalizar turno actual</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setIsRegisterDropdownOpen(false);
                                                    await fetchRegisterStats();
                                                    setIsCloseRegisterModalOpen(true);
                                                }}
                                                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-slate-700 group text-left"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                                                    <Clipboard className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="flex flex-col leading-tight">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Ver Resumen</span>
                                                    <span className="text-[9px] font-medium text-slate-400">Estadísticas del día</span>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsRegisterDropdownOpen(false);
                                                setIsRegisterModalOpen(true);
                                            }}
                                            className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-slate-700 group text-left"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                                <Unlock className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-[10px] font-black uppercase tracking-widest">Abrir caja</span>
                                                <span className="text-[9px] font-medium text-slate-400">Comenzar nuevo turno</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
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

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                    <button
                        onClick={() => setCategory('')}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 whitespace-nowrap ${category === ''
                            ? 'bg-primary-600 border-primary-600 text-white shadow-2xl shadow-primary-500/30'
                            : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat._id}
                            onClick={() => setCategory(cat.name)}
                            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 whitespace-nowrap ${category === cat.name
                                ? 'bg-primary-600 border-primary-600 text-white shadow-2xl shadow-primary-500/30'
                                : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pr-4 pb-20 custom-scrollbar">
                    {products.map(product => {
                        const inCart = cart.find(item => item._id === product._id)?.quantity || 0;
                        const availableStock = product.stock - inCart;

                        return (
                            <div key={product._id} className="group relative">
                                <button
                                    onClick={() => addToCart(product)}
                                    className={`w-full bg-white rounded-[2rem] p-4 flex flex-col gap-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 active:scale-95 text-center overflow-hidden border border-slate-100 hover:border-primary-100`}
                                >
                                    <div className="aspect-square w-full bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100/50 flex items-center justify-center relative group-hover:bg-primary-50 transition-colors duration-500 mt-2">
                                        <ChefHat className="w-10 h-10 text-slate-100 group-hover:text-primary-100 transition-colors absolute" />
                                        {product.images?.[0]?.url && (
                                            <img
                                                src={product.images[0].url}
                                                className="w-full h-full object-contain p-2 relative z-[1] group-hover:scale-110 transition-transform duration-700"
                                                alt={product.name}
                                            />
                                        )}
                                        {inCart > 0 && (
                                            <div className="absolute top-2 left-2 bg-primary-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-bounce-short z-[2]">
                                                {inCart}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 items-center pb-2">
                                        <span className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase italic">
                                            {currency}{product.price}
                                        </span>

                                        <h3 className="font-medium text-slate-600 text-xs tracking-tight line-clamp-2 min-h-[2.5rem] px-2">
                                            {product.name}
                                        </h3>

                                        <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${availableStock > 0
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-slate-50 text-slate-400'
                                            }`}>
                                            {availableStock} disponibles
                                        </div>
                                    </div>

                                    {/* Botón flotante opcional de agregar (micro-animación) */}
                                    <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-500`}>
                                        <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

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
                                            <button
                                                onClick={() => {
                                                    setCart(cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
                                                }}
                                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition-all"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
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
                            onClick={() => setIsPaymentModalOpen(true)}
                            disabled={cart.length === 0 || isSubmitting}
                            className="flex-[3] h-20 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                        >
                            Continuar Venta
                            <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL DE PAGO (IMAGEN 1) */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
                    <div className="relative bg-white h-full w-full max-w-md shadow-2xl animate-slide-left flex flex-col">
                        <div className="p-8 flex items-center gap-6 border-b border-slate-100">
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <ArrowLeft className="w-6 h-6 text-slate-400" />
                            </button>
                            <h3 className="text-2xl font-black text-slate-900 italic uppercase">Pago</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            {/* Selector Pagada / A Crédito */}
                            <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                                <button
                                    onClick={() => setSaleStatus('paid')}
                                    className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${saleStatus === 'paid' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}
                                >
                                    Pagada
                                </button>
                                <button
                                    onClick={() => setSaleStatus('credit')}
                                    className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${saleStatus === 'credit' ? 'bg-yellow-500 text-white shadow-lg' : 'text-slate-500'}`}
                                >
                                    A crédito
                                </button>
                            </div>

                            {/* Fecha */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de la venta *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={saleDate}
                                        onChange={(e) => setSaleDate(e.target.value)}
                                        className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm"
                                    />
                                </div>
                            </div>

                            {/* Cliente */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm appearance-none"
                                    >
                                        <option>Cliente de Mostrador</option>
                                        <option>Nuevo Cliente...</option>
                                    </select>
                                </div>
                            </div>

                            {/* Descuento */}
                            <button className="flex items-center gap-3 text-primary-600 font-bold text-sm">
                                <Percent className="w-4 h-4" />
                                <span className="underline underline-offset-4">Agregar un descuento</span>
                            </button>

                            <hr className="border-slate-100" />

                            {/* Número de pagos */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecciona el número de pagos que realizarás y el método de pago*</label>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setNumPayments(n)}
                                            className={`w-12 h-12 rounded-xl border-2 font-black text-xs transition-all ${numPayments === n ? 'bg-amber-400 border-amber-400 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                    <button className="px-6 h-12 rounded-xl border-2 border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">Otro</button>
                                </div>
                            </div>

                            {/* Método de pago */}
                            <div className="space-y-4 pb-10">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecciona el método de pago*</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all relative ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100'}`}
                                    >
                                        {paymentMethod === 'cash' && <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                                        <Banknote className={`w-8 h-8 ${paymentMethod === 'cash' ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'cash' ? 'text-emerald-700' : 'text-slate-400'}`}>Efectivo</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all relative ${paymentMethod === 'card' ? 'border-primary-500 bg-primary-50/30' : 'border-slate-100'}`}
                                    >
                                        {paymentMethod === 'card' && <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                                        <CreditCard className={`w-8 h-8 ${paymentMethod === 'card' ? 'text-primary-500' : 'text-slate-300'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'card' ? 'text-primary-700' : 'text-slate-400'}`}>Tarjeta</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('transfer')}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all relative ${paymentMethod === 'transfer' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100'}`}
                                    >
                                        {paymentMethod === 'transfer' && <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                                        <ArrowLeftRight className={`w-8 h-8 ${paymentMethod === 'transfer' ? 'text-indigo-500' : 'text-slate-300'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'transfer' ? 'text-indigo-700' : 'text-slate-400'}`}>Transferencia</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('other')}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all relative ${paymentMethod === 'other' ? 'border-slate-400 bg-slate-50' : 'border-slate-100'}`}
                                    >
                                        <PlusCircle className="w-8 h-8 text-slate-300" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Otro</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer del Pago */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Detalle del pago</span>
                                <Plus className="w-4 h-4 text-slate-400 rotate-45" />
                            </div>
                            <div className="flex gap-4">
                                <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                                    <Printer className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => {
                                        if (paymentMethod === 'cash') setIsChangeModalOpen(true);
                                        else handleCheckout();
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-between px-8 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-slate-800 rounded-lg flex items-center justify-center text-[10px]">{numPayments}</span>
                                        {paymentMethod === 'cash' ? 'Crear Venta' :
                                            paymentMethod === 'card' ? 'Cobrar con Tarjeta' :
                                                paymentMethod === 'transfer' ? 'Cobrar con Transf.' : 'Crear Venta'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="opacity-50 font-medium">RD$</span>
                                        {total.toLocaleString()}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CALCULADORA DE CAMBIO (IMAGEN 2) */}
            {isChangeModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsChangeModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-10 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 italic uppercase">Calcula el cambio de tu venta</h3>
                            <button onClick={() => setIsChangeModalOpen(false)}><X className="w-6 h-6 text-slate-300" /></button>
                        </div>
                        <div className="p-10 pt-0 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Valor de la venta</label>
                                <div className="h-16 bg-slate-50 rounded-2xl flex items-center px-6 font-black text-slate-900 text-xl italic">{currency}{total.toLocaleString()}</div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">¿Con cuánto paga tu cliente?</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl italic">RD$</span>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={receivedAmount}
                                        onChange={(e) => setReceivedAmount(e.target.value)}
                                        className="w-full h-16 pl-16 pr-6 bg-white border-2 border-slate-900 rounded-2xl font-black text-xl italic"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor a devolver</span>
                                <span className="text-2xl font-black text-slate-900 italic tracking-tighter">
                                    RD${Math.max(0, (parseFloat(receivedAmount) || 0) - total).toLocaleString()}
                                </span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={isSubmitting}
                                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Procesando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ÉXITO (IMAGEN 3) - REPLANTEADO */}
            {isSuccessModalOpen && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsSuccessModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in flex flex-col">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">¡Creaste una venta!</h3>
                                <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-wide">Se registró en tu balance por un valor de <span className="text-slate-900 font-black">RD${(lastSale?.total || 0).toLocaleString()}</span></p>
                            </div>

                            <div className="space-y-3 pt-2 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">¿Quieres darle un nombre a esta venta?</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={saleName}
                                        onChange={(e) => setSaleName(e.target.value)}
                                        placeholder={`Venta ${lastSale?.invoiceNumber || ''}`}
                                        className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary-500 transition-all outline-none text-base placeholder:text-slate-300 shadow-sm group-hover:border-slate-200"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Check className={`w-5 h-5 transition-all ${saleName ? 'text-emerald-500 scale-100' : 'text-slate-200 scale-90'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100/50">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-black text-xs text-slate-900 uppercase italic">Comprobante</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Puedes descargar el comprobante de venta.</span>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={handlePrint}
                                        className="w-full h-12 bg-slate-200/50 hover:bg-slate-200/80 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir comprobante
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="w-full h-12 bg-slate-200/50 hover:bg-slate-200/80 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600"
                                    >
                                        <Download className="w-4 h-4" />
                                        Descarga el comprobante
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex flex-col gap-3 bg-white">
                            <button
                                onClick={async () => {
                                    const finalName = saleName;
                                    const saleId = lastSale?._id;
                                    setIsSuccessModalOpen(false);
                                    setSaleName('');
                                    setCustomerName('Cliente de Mostrador');

                                    if (finalName && saleId) {
                                        try {
                                            await axios.patch(`/api/sales/${saleId}/details`, { customerName: finalName });
                                            toast.success('Nombre de venta actualizado');
                                        } catch (e) {
                                            console.error('Error saving sale name:', e);
                                        }
                                    }
                                }}
                                className="w-full h-15 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-[0.98]"
                            >
                                Seguir vendiendo
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={async () => {
                                        const finalName = saleName;
                                        const saleId = lastSale?._id;
                                        setIsSuccessModalOpen(false);
                                        setSaleName('');
                                        setIsFreeSaleModalOpen(true);

                                        if (finalName && saleId) {
                                            try { await axios.patch(`/api/sales/${saleId}/details`, { customerName: finalName }); } catch (e) { }
                                        }
                                    }}
                                    className="h-14 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                                >
                                    Nueva venta libre
                                </button>
                                <button
                                    onClick={async () => {
                                        const finalName = saleName;
                                        const saleId = lastSale?._id;
                                        if (finalName && saleId) {
                                            try { await axios.patch(`/api/sales/${saleId}/details`, { customerName: finalName }); } catch (e) { }
                                        }
                                        window.location.href = '/movements';
                                    }}
                                    className="h-14 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                                >
                                    Ir a movimientos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            {/* MODAL APERTURA DE CAJA */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setIsRegisterModalOpen(false)}></div>
                    <form onSubmit={handleOpenRegister} className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-10 flex items-center justify-between border-b border-slate-100">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 italic uppercase">Apertura de Caja</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ingresa el fondo inicial para comenzar</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <Banknote className="w-6 h-6 text-emerald-500" />
                            </div>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Monto Inicial en Caja</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl italic">{currency}</span>
                                    <input
                                        type="number"
                                        autoFocus
                                        required
                                        min="0"
                                        value={initialCash}
                                        onChange={(e) => setInitialCash(e.target.value)}
                                        className="w-full h-16 pl-16 pr-6 bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-2xl font-black text-2xl italic text-slate-900 transition-all outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Unlock className="w-4 h-4" />
                                Abrir Caja
                            </button>
                        </div>
                    </form>
                </div>
            )}


            {/* MODAL CIERRE DE CAJA */}
            {isCloseRegisterModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setIsCloseRegisterModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="p-8 pb-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Cierre de Caja</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verificación de fondos y ventas del día</p>
                            </div>
                            <button onClick={() => setIsCloseRegisterModalOpen(false)}><X className="w-8 h-8 text-slate-300" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Resumen de Ventas NO Efectivo */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Tarjeta</p>
                                    <p className="text-xl font-black text-blue-900 italic tracking-tighter">{currency}{registerStats.card.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Transferencia</p>
                                    <p className="text-xl font-black text-indigo-900 italic tracking-tighter">{currency}{registerStats.transfer.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas Totales</p>
                                    <p className="text-xl font-black text-slate-900 italic tracking-tighter">{currency}{registerStats.total.toLocaleString()}</p>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Cálculo de Efectivo */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                                    <span className="font-bold text-sm text-slate-500 uppercase tracking-wide">Fondo Inicial</span>
                                    <span className="font-black text-lg text-slate-900 italic">{currency}{parseFloat(initialCash || '0').toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                                    <span className="font-bold text-sm text-emerald-600 uppercase tracking-wide flex items-center gap-2">
                                        <PlusCircle className="w-4 h-4" /> Ventas en Efectivo
                                    </span>
                                    <span className="font-black text-lg text-emerald-700 italic">{currency}{registerStats.cash.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Debe haber en efectivo</p>
                                        <p className="text-3xl font-black italic tracking-tighter mt-1">
                                            {currency}{(parseFloat(initialCash || '0') + registerStats.cash).toLocaleString()}
                                        </p>
                                    </div>
                                    <Calculator className="w-10 h-10 text-slate-700" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Total Efectivo Real (Contado)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl italic">{currency}</span>
                                    <input
                                        type="number"
                                        value={countedCash}
                                        onChange={(e) => setCountedCash(e.target.value)}
                                        className={`w-full h-16 pl-14 pr-6 border-2 rounded-2xl font-black text-2xl italic outline-none transition-all ${Math.abs((parseFloat(countedCash || '0') - (parseFloat(initialCash || '0') + registerStats.cash))) < 1
                                            ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700'
                                            : countedCash ? 'border-amber-500 bg-amber-50/30 text-amber-700' : 'border-slate-200 bg-white text-slate-900'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    {countedCash && (
                                        <div className={`absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${Math.abs((parseFloat(countedCash || '0') - (parseFloat(initialCash || '0') + registerStats.cash))) < 1
                                            ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                            }`}>
                                            {Math.abs((parseFloat(countedCash || '0') - (parseFloat(initialCash || '0') + registerStats.cash))) < 1 ? 'Cuadra' : 'Descuadre'}
                                        </div>
                                    )}
                                </div>
                                {countedCash && (
                                    <p className={`text-right text-xs font-black uppercase tracking-widest ${(parseFloat(countedCash || '0') - (parseFloat(initialCash || '0') + registerStats.cash)) >= 0
                                        ? 'text-emerald-500' : 'text-red-500'
                                        }`}>
                                        Diferencia: {currency}{(parseFloat(countedCash || '0') - (parseFloat(initialCash || '0') + registerStats.cash)).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button
                                onClick={() => setIsCloseRegisterModalOpen(false)}
                                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCloseRegister}
                                className="flex-[2] h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                <Lock className="w-4 h-4" />
                                Cerrar Caja Definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EXPENSE MODAL */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)}></div>
                    <form onSubmit={handleCreateExpense} className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <Wallet className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 italic uppercase">Nuevo gasto</h3>
                            </div>
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)}><X className="w-6 h-6 text-slate-300 hover:text-slate-600" /></button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                            <p className="text-[10px] text-slate-400 font-medium">Los campos marcados con asterisco (*) son obligatorios</p>

                            {/* Status Selector */}
                            <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setExpenseForm({ ...expenseForm, status: 'paid' })}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${expenseForm.status === 'paid' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:shadow-sm'}`}
                                >
                                    Pagada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpenseForm({ ...expenseForm, status: 'debt' })}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${expenseForm.status === 'debt' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:bg-white'}`}
                                >
                                    En deuda
                                </button>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha del gasto*</label>
                                <input
                                    type="date"
                                    required
                                    value={expenseForm.date}
                                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 transition-colors"
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría del gasto*</label>
                                <select
                                    required
                                    value={expenseForm.category}
                                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 transition-colors bg-white"
                                >
                                    <option value="">Selecciona una categoría</option>
                                    <option value="servicios">Servicios (Luz, Agua, etc.)</option>
                                    <option value="insumos">Insumos / Materia Prima</option>
                                    <option value="nomina">Nómina</option>
                                    <option value="mantenimiento">Mantenimiento</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            {/* Value */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor*</label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-red-500 transition-colors">
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        value={expenseForm.amount}
                                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        className="w-full h-12 px-4 font-black text-lg outline-none text-right"
                                    />
                                    <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-t border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Valor total</span>
                                        <span className="text-sm font-black text-red-500">= {currency}{parseFloat(expenseForm.amount || '0').toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">¿Quieres darle un nombre a este gasto?</label>
                                <input
                                    type="text"
                                    placeholder="Escríbelo aquí"
                                    value={expenseForm.name}
                                    onChange={e => setExpenseForm({ ...expenseForm, name: e.target.value })}
                                    className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 transition-colors"
                                />
                            </div>

                            {/* Provider */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agrega un proveedor al gasto</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={expenseForm.provider}
                                        onChange={e => setExpenseForm({ ...expenseForm, provider: e.target.value })}
                                        className="w-full h-12 pl-10 pr-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-red-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecciona el método de pago*</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'cash' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${expenseForm.paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Wallet className="w-4 h-4 text-slate-500" /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Efectivo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'card' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${expenseForm.paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Wallet className="w-4 h-4 text-slate-500" /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Tarjeta</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'transfer' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${expenseForm.paymentMethod === 'transfer' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><Wallet className="w-4 h-4 text-slate-500" /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Transferencia</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'other' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${expenseForm.paymentMethod === 'other' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-slate-500" /></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Otro</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                                Crear Gasto
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
