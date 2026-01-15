'use client';

import { useState } from 'react';
import { FixedExpense } from '@/app/lib/types';
import { addFixedExpense, updateFixedExpense } from '@/app/lib/actions';

interface FixedExpenseFormProps {
    initialData?: FixedExpense | null;
    onSuccess: () => void;
    onCancel?: () => void;
    onDelete?: (id: string | number) => void;
    defaultCategory?: 'PERSONAL' | 'KATHCAKE';
}

export default function FixedExpenseForm({ initialData, onSuccess, onCancel, onDelete, defaultCategory }: FixedExpenseFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState<'PERSONAL' | 'KATHCAKE'>(initialData?.category || defaultCategory || 'PERSONAL');

    // Initialize date: Create a date object matching the next payment occurrence
    const calculateInitialDate = () => {
        if (initialData?.startDate) return initialData.startDate;
        if (!initialData?.paymentLimitDay) return new Date().toISOString().split('T')[0];

        const today = new Date();
        const day = initialData.paymentLimitDay;

        // Create candidate date for this month
        let targetDate = new Date(today.getFullYear(), today.getMonth(), day);

        // If the day for this month has already passed, show next month's date
        // Note: We check if the day part is less than today's day to be simple, 
        // or compare timestamps. Comparing date objects directly works.
        if (targetDate < today) {
            targetDate.setMonth(targetDate.getMonth() + 1);
        }

        const yyp = targetDate.getFullYear();
        const mmp = String(targetDate.getMonth() + 1).padStart(2, '0');
        const ddp = String(day).padStart(2, '0');

        return `${yyp}-${mmp}-${ddp}`;
    };

    const [paymentDate, setPaymentDate] = useState(calculateInitialDate());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !amount) return;

        // Extract Day from picked date
        const dateObj = new Date(paymentDate);
        // We use getUTCDate because the input value is YYYY-MM-DD which is parsed as UTC midnight? 
        // No, new Date('2024-02-05') is UTC. getUTCDate() returns 5.
        // Actually browsers vary. Safer to split string.
        const dayPart = parseInt(paymentDate.split('-')[2]);

        const newExpense: FixedExpense = {
            id: initialData?.id || crypto.randomUUID(),
            name,
            amount: parseFloat(amount),
            paymentLimitDay: dayPart,
            startDate: paymentDate, // Save the full date chosen
            category,
        };

        if (initialData) {
            await updateFixedExpense(newExpense);
        } else {
            await addFixedExpense(newExpense);
        }

        // Reset form
        setName('');
        setAmount('');
        // Keep date or reset to today
        setPaymentDate(new Date().toISOString().split('T')[0]);
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{initialData ? 'Editar Gasto Fijo' : 'Agregar Gasto Fijo'}</h3>

            {!defaultCategory && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as 'PERSONAL' | 'KATHCAKE')}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                        <option value="PERSONAL">Personal</option>
                        <option value="KATHCAKE">Kathcake</option>
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Internet, Alquiler"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monto Mensual</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio / Pago</label>
                    <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">El sistema calculará el día del mes.</p>
                </div>
            </div>

            <div className="flex gap-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 rounded-xl text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas eliminar este gasto fijo?')) {
                                onDelete(initialData.id);
                            }
                        }}
                        className="py-3 px-4 rounded-xl text-rose-600 font-medium bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                        Eliminar
                    </button>
                )}
                <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl text-white font-medium bg-slate-800 hover:bg-slate-900 transition-colors"
                >
                    {initialData ? 'Actualizar' : 'Guardar'} Gasto Fijo
                </button>
            </div>
        </form >
    );
}
