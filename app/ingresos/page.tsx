'use client';

import { useState } from 'react';
import Layout from '../components/Layout';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { useTransactions, useSettings } from '../lib/hooks';
import { formatCurrency } from '@/app/lib/utils';
import { Transaction } from '../lib/types';

export default function IngresosPage() {
    const { transactions, loading, refreshTransactions, removeTransaction } = useTransactions();
    const { settings } = useSettings();
    const { currencySymbol } = settings;
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isManageMode, setIsManageMode] = useState(false);
    const [transactionCategory, setTransactionCategory] = useState<'PERSONAL' | 'KATHCAKE'>('PERSONAL');

    const incomes = transactions.filter(t => t.type === 'INCOME' && t.transactionCategory === transactionCategory);

    const handleSuccess = () => {
        refreshTransactions();
        setEditingTransaction(null);
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {transactionCategory === 'KATHCAKE' ? '🎂 Ingresos Kathcake' : '🏠 Ingresos Personales'}
                        </h2>
                        <p className="text-slate-500">Registra tus ventas y entradas de dinero.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                            <button
                                onClick={() => setTransactionCategory('PERSONAL')}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${transactionCategory === 'PERSONAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Personal
                            </button>
                            <button
                                onClick={() => setTransactionCategory('KATHCAKE')}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${transactionCategory === 'KATHCAKE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Kathcake
                            </button>
                        </div>
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
                        <div className={`${transactionCategory === 'KATHCAKE' ? 'bg-emerald-600' : 'bg-blue-600'} text-white p-4 rounded-2xl shadow-sm text-center`}>
                            <p className="opacity-80 text-xs font-medium uppercase tracking-wider mb-1">Total Ingresos {transactionCategory.toLowerCase()}</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(incomes.reduce((sum, t) => sum + t.amount, 0), settings.currency, currencySymbol)}
                            </p>
                        </div>
                        <TransactionForm
                            type="INCOME"
                            defaultCategory={transactionCategory}
                            onSuccess={handleSuccess}
                            initialData={editingTransaction}
                            onCancel={editingTransaction ? () => setEditingTransaction(null) : undefined}
                            onDelete={removeTransaction}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            {isManageMode ? 'Modo de Edición Activo' : 'Historial de Ingresos'}
                        </h3>
                        {isManageMode && (
                            <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-100 italic">
                                Haz clic en los iconos para editar o eliminar registros del historial.
                            </div>
                        )}
                        <TransactionList
                            transactions={incomes}
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
