'use client';

import { useState } from 'react';
import { FixedExpense } from '@/app/lib/types';
import { addFixedExpense, updateFixedExpense } from '@/app/lib/actions';

interface FixedExpenseFormProps {
    initialData?: FixedExpense | null;
    onSuccess: () => void;
    onCancel?: () => void;
    onDelete?: (id: string | number) => void;
}

export default function FixedExpenseForm({ initialData, onSuccess, onCancel, onDelete }: FixedExpenseFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [paymentLimitDay, setPaymentLimitDay] = useState(initialData?.paymentLimitDay?.toString() || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !amount) return;

        const newExpense: FixedExpense = {
            id: initialData?.id || crypto.randomUUID(),
            name,
            amount: parseFloat(amount),
            paymentLimitDay: paymentLimitDay ? parseInt(paymentLimitDay) : undefined,
        };

        if (initialData) {
            await updateFixedExpense(newExpense);
        } else {
            await addFixedExpense(newExpense);
        }

        // Reset form
        setName('');
        setAmount('');
        setPaymentLimitDay('');
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{initialData ? 'Editar Gasto Fijo' : 'Agregar Gasto Fijo'}</h3>

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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Día Límite Pago</label>
                    <input
                        type="number"
                        min="1" max="31"
                        value={paymentLimitDay}
                        onChange={(e) => setPaymentLimitDay(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ej: 5"
                    />
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
                <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl text-white font-medium bg-slate-800 hover:bg-slate-900 transition-colors"
                >
                    {initialData ? 'Actualizar' : 'Guardar'} Gasto Fijo
                </button>
            </div>
        </form>
    );
}
