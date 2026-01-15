'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/app/lib/types';
import { addTransaction, updateTransaction } from '@/app/lib/actions';
import { useSettings } from '@/app/lib/hooks';

interface TransactionFormProps {
    type: TransactionType;
    initialData?: Transaction | null;
    onSuccess: () => void;
    onCancel?: () => void;
    onDelete?: (id: string | number) => void;
}

export default function TransactionForm({ type, initialData, onSuccess, onCancel, onDelete }: TransactionFormProps) {
    const { settings } = useSettings();
    const { currencySymbol } = settings;

    const [amount, setAmount] = useState(initialData?.amount.toString() || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'Efectivo');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<'PAID' | 'PENDING'>(initialData?.status || 'PAID');
    const [location, setLocation] = useState(initialData?.location || '');
    const [dueDate, setDueDate] = useState(initialData?.dueDate || '');

    // Synchronize form with initialData when it changes (essential for editing different transactions)
    useEffect(() => {
        if (initialData) {
            setAmount(initialData.amount.toString());
            setDescription(initialData.description);
            setCategory(initialData.category);
            setPaymentMethod(initialData.paymentMethod);
            setDate(initialData.date);
            setStatus(initialData.status);
            setLocation(initialData.location || '');
            setDueDate(initialData.dueDate || '');
        } else {
            // Reset for new entry
            setAmount('');
            setDescription('');
            setCategory('');
            setPaymentMethod('Efectivo');
            setDate(new Date().toISOString().split('T')[0]);
            setStatus('PAID');
            setLocation('');
            setDueDate('');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !description || !category) return;

        const transactionData: Transaction = {
            id: initialData?.id || crypto.randomUUID(),
            date,
            type,
            category,
            description,
            amount: parseFloat(amount),
            paymentMethod,
            status,
            location: location || undefined,
            dueDate: dueDate || undefined,
        };

        if (initialData) {
            await updateTransaction(transactionData);
        } else {
            await addTransaction(transactionData);
        }

        // Reset form
        setAmount('');
        setDescription('');
        setCategory('');
        setLocation('');
        setDueDate('');
        onSuccess();
    };

    const categories = type === 'EXPENSE'
        ? ['Insumos', 'Gastos Fijos', 'Servicios', 'Mantenimiento', 'Sueldos', 'Otros']
        : ['Ventas', 'Inversión', 'Préstamo', 'Otros'];

    const commonDescriptions = type === 'INCOME'
        ? [
            'BIZCOCHO DE VAINILLA 1/2 LB', 'BIZCOCHO DE VAINILLA 1 LB O MAS',
            'BIZCOCHO DE CHOCOLATE 1/2 LB', 'BIZCOCHO DE CHOCOLATE 1 LB O MAS',
            'VENTA DEL DIA', 'CHEESCAKE COMPLETO', 'FLAN COMPLETO',
            'CHOCOFLAN COMPLETO', 'BESO DE ANGEL COMPLETO'
        ]
        : [
            'MANTEQUILLA', 'HARINA', 'AZUCAR', 'LECHE ENTERA', 'LECHE CONDENSADA',
            'CREMA DE LECHE', 'CREMA CHANTILLY', 'CACAO', 'CHOCOLATE COBERTURA',
            'FRESAS', 'GASTOS PERSONALES', 'COCO Y LECHE DE COCO', 'HUEVOS',
            'CHINOLA', 'COCTELES', 'MTD INGREDIENTES', 'AGUA', 'PAGO SAN', 'GAS',
            'QUESO CREMA', 'PAPELERIA', 'REDONDELES Y FON', 'CAJAS PARA BIZCOCHOS',
            'TRANSPORTE PEDIDOS', 'RON', 'CHISPAS DE CHOCOLATE', 'LECHE EVAPORADA',
            'DULCE DE LECHE', 'MATERIALES PARA DECORACION', 'MATERIALES COMPLEMENTARIOS',
            'CHUGAR SHOP', 'YOSHIDA', 'MANGAS DE RELLENOS', 'CUCHARAS',
            'PLATOS DESECHABLES PARA PORCIONES', 'TRANSPORTE', 'SALARIO KATHERINE',
            'GALLETA OREO O MARIA', 'SALARIO DIARIO KRISBEL', 'RENTA DIARIA',
            'REFRESCOS Y AGUA', 'MATERIALES DE LIMPIEZA', 'ENERGIA ELECTRICA DIARIA',
            'ACEITE', 'PAGO INTERNET'
        ];

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
                {initialData ? 'Editar ' : 'Registrar '} {type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monto ({currencySymbol})</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <input
                    type="text"
                    required
                    list={`${type}-descriptions`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Bizcocho de Zanahoria"
                />
                <datalist id={`${type}-descriptions`}>
                    {commonDescriptions.map(desc => (
                        <option key={desc} value={desc} />
                    ))}
                </datalist>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                    <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                        <option value="">Seleccionar...</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Tarjeta">Tarjeta</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                    <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={status === 'PAID'}
                                onChange={() => setStatus('PAID')}
                                className="text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Pagado</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={status === 'PENDING'}
                                onChange={() => setStatus('PENDING')}
                                className="text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Pendiente</span>
                        </label>
                    </div>
                </div>

                {type === 'EXPENSE' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Límite (Opcional)</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación / Lugar (Opcional)</label>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Banco Mercantil, Caja Principal"
                />
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    className={`flex-1 ${type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-purple-200`}
                >
                    {initialData ? 'Actualizar' : 'Guardar'} {type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                </button>
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('¿Deseas eliminar este registro de forma permanente?')) {
                                onDelete(initialData.id);
                                onSuccess();
                                window.location.reload();
                            }
                        }}
                        className="px-4 py-2 border border-rose-200 text-rose-600 font-medium rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-2"
                        title="Eliminar registro"
                    >
                        <span>Borrar</span>
                        <span>🗑️</span>
                    </button>
                )}
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </form>
    );
}
