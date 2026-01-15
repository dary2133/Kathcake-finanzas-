'use client';

import { useState } from 'react';
import Layout from '../components/Layout';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { useTransactions, useSettings } from '../lib/hooks';
import { formatCurrency } from '@/app/lib/utils';
import { Transaction } from '../lib/types';

export default function GastosPage() {
    const { transactions, loading, refreshTransactions, removeTransaction, resetTransactions } = useTransactions();
    const { settings } = useSettings();
    const { currencySymbol } = settings;
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isManageMode, setIsManageMode] = useState(false);

    const expenses = transactions.filter(t => t.type === 'EXPENSE');

    const handleSuccess = () => {
        refreshTransactions();
        setEditingTransaction(null);
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Gastos</h2>
                        <p className="text-slate-500">Registra y controla tus salidas de dinero.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                setIsManageMode(!isManageMode);
                                if (isManageMode) setEditingTransaction(null);
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${isManageMode
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {isManageMode ? '✅ Finalizar' : '✏️ Editar'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
                        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-sm text-center">
                            <p className="text-rose-100 text-xs font-medium uppercase tracking-wider mb-1">Total Gastos</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(expenses.reduce((sum, t) => sum + t.amount, 0), settings.currency, currencySymbol)}
                            </p>
                        </div>
                        <TransactionForm
                            type="EXPENSE"
                            onSuccess={handleSuccess}
                            initialData={editingTransaction}
                            onCancel={editingTransaction ? () => setEditingTransaction(null) : undefined}
                            onDelete={removeTransaction}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            {isManageMode ? 'Modo de Edición Activo' : 'Historial de Gastos'}
                        </h3>
                        {isManageMode && (
                            <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-100 italic">
                                Haz clic en los iconos para editar o eliminar registros del historial.
                            </div>
                        )}
                        <TransactionList
                            transactions={expenses}
                            onDelete={removeTransaction}
                            onEdit={(t) => {
                                setEditingTransaction(t);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            showActions={isManageMode}
                        />
                        {loading && <p className="text-slate-400 text-center py-4">Cargando...</p>}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
