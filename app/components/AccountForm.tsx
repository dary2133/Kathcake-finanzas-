'use client';

import { useState } from 'react';
import { Account, AccountType } from '@/app/lib/types';
import { addAccount, updateAccount } from '@/app/lib/actions';

interface AccountFormProps {
    initialData?: Account | null;
    onSuccess: () => void;
    onCancel?: () => void;
    onDelete?: (id: string | number) => void;
}

export default function AccountForm({ initialData, onSuccess, onCancel, onDelete }: AccountFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<AccountType>(initialData?.type || 'CASH');
    const [balance, setBalance] = useState(initialData?.balance?.toString() || '');
    const [limit, setLimit] = useState(initialData?.limit?.toString() || '');
    const [cutoffDay, setCutoffDay] = useState(initialData?.cutoffDay?.toString() || '');
    const [paymentLimitDay, setPaymentLimitDay] = useState(initialData?.paymentLimitDay?.toString() || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) return;

        const newAccount: Account = {
            id: initialData?.id || crypto.randomUUID(),
            name,
            type,
            balance: parseFloat(balance) || 0,
        };

        if (type === 'CREDIT') {
            if (limit) newAccount.limit = parseFloat(limit);
            if (cutoffDay) newAccount.cutoffDay = parseInt(cutoffDay);
            if (paymentLimitDay) newAccount.paymentLimitDay = parseInt(paymentLimitDay);
        }

        if (initialData) {
            await updateAccount(newAccount);
        } else {
            await addAccount(newAccount);
        }

        // Reset form
        setName('');
        setType('CASH');
        setBalance('');
        setLimit('');
        setCutoffDay('');
        setPaymentLimitDay('');
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{initialData ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}</h3>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Cuenta</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Banco Popular, Tarjeta Visa"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as AccountType)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                        <option value="CASH">Efectivo / Caja</option>
                        <option value="BANK">Cuenta Bancaria</option>
                        <option value="INVESTMENT">Fondo de Inversión</option>
                        <option value="CREDIT">Tarjeta de Crédito</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {type === 'CREDIT' ? 'Deuda Actual' : 'Saldo Actual'}
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {type === 'CREDIT' && (
                <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 uppercase">Configuración de Tarjeta</h4>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Límite de Crédito</label>
                        <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ej: 50000"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Día Corte</label>
                            <input
                                type="number"
                                min="1" max="31"
                                value={cutoffDay}
                                onChange={(e) => setCutoffDay(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Día (ej: 28)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Día Pago</label>
                            <input
                                type="number"
                                min="1" max="31"
                                value={paymentLimitDay}
                                onChange={(e) => setPaymentLimitDay(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Día (ej: 15)"
                            />
                        </div>
                    </div>
                </div>
            )}

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
                    className="flex-1 py-3 px-4 rounded-xl text-white font-medium bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                    {initialData ? 'Actualizar' : 'Guardar'} Cuenta
                </button>
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('¿Deseas eliminar esta cuenta de forma permanente?')) {
                                onDelete(initialData.id);
                                onSuccess();
                                window.location.reload();
                            }
                        }}
                        className="p-3 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Borrar Cuenta"
                    >
                        🗑️
                    </button>
                )}
            </div>
        </form>
    );
}
