'use client';

import { Transaction } from '@/app/lib/types';
import { useSettings } from '@/app/lib/hooks';
import { formatCurrency, formatDate } from '@/app/lib/utils';

interface TransactionListProps {
    transactions: Transaction[];
    onDelete?: (id: string | number) => void;
    onEdit?: (transaction: Transaction) => void;
    onReset?: () => void;
    showActions?: boolean;
}

export default function TransactionList({ transactions, onDelete, onEdit, onReset, showActions = false }: TransactionListProps) {
    const { settings } = useSettings();
    const { currencySymbol } = settings;

    if (transactions.length === 0) {
        return (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
                <p className="text-slate-400">No hay movimientos registrados.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-left">Fecha</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-left">Descripción</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-left">Categoría</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Monto</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-left">Estado</th>
                            {showActions && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                    {formatDate(t.date)}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                                    {t.description}
                                    {t.dueDate && (
                                        <div className="text-xs text-rose-500 mt-1">Vence: {formatDate(t.dueDate)}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                        {t.category}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap text-right ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount, settings.currency, currencySymbol)}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === 'PAID'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-orange-50 text-orange-700'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'PAID' ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                                        {t.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                </td>
                                {showActions && (
                                    <td className="px-6 py-4 text-sm text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit && onEdit(t)}
                                                className="text-blue-600 hover:bg-blue-50 py-1 px-3 rounded-lg transition-all border border-blue-100 bg-white text-xs font-bold flex items-center gap-1"
                                            >
                                                <span>Editar</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('¿Eliminar este registro?')) {
                                                        onDelete && onDelete(t.id);
                                                        window.location.reload();
                                                    }
                                                }}
                                                className="text-rose-600 hover:bg-rose-50 py-1 px-3 rounded-lg transition-all border border-rose-100 bg-white text-xs font-bold flex items-center gap-1"
                                            >
                                                <span>Eliminar</span>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
