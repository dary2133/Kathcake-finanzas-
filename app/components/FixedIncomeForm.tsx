'use client';

import { useState } from 'react';
import { FixedIncome } from '@/app/lib/types';
import { addFixedIncome, updateFixedIncome } from '@/app/lib/actions';

interface FixedIncomeFormProps {
    initialData?: FixedIncome | null;
    onSuccess: () => void;
    onCancel?: () => void;
    onDelete?: (id: string | number) => void;
}

export default function FixedIncomeForm({ initialData, onSuccess, onCancel, onDelete }: FixedIncomeFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [paymentDay, setPaymentDay] = useState(initialData?.paymentDay?.toString() || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !amount) return;

        const newIncome: FixedIncome = {
            id: initialData?.id || crypto.randomUUID(),
            name,
            amount: parseFloat(amount),
            paymentDay: paymentDay ? parseInt(paymentDay) : undefined,
        };

        if (initialData) {
            await updateFixedIncome(newIncome);
        } else {
            await addFixedIncome(newIncome);
        }

        // Reset form
        setName('');
        setAmount('');
        setPaymentDay('');
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-slate-800">{initialData ? 'Editar Ingreso Fijo' : 'Nuevo Ingreso Fijo'}</h3>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej: Salario, Alquiler"
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
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Día de Cobro</label>
                    <input
                        type="number"
                        min="1" max="31"
                        value={paymentDay}
                        onChange={(e) => setPaymentDay(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ej: 15"
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
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('¿Eliminar este ingreso fijo?')) {
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
                    className="flex-1 py-3 px-4 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                    {initialData ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}
