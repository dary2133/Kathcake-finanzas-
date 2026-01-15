'use client';

import { useEffect } from 'react';
import { useTransactions, useSettings } from '@/app/lib/hooks';
import { formatCurrency } from '@/app/lib/utils';

export default function Dashboard() {
    const { transactions, loading, refreshTransactions } = useTransactions();
    const { settings } = useSettings();

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando datos...</div>;
    }

    const { currencySymbol } = settings;

    // Calculate Totals
    const totalIncome = transactions
        .filter(t => t.type === 'INCOME' && t.status === 'PAID')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    const pendingIncome = transactions
        .filter(t => t.type === 'INCOME' && t.status === 'PENDING')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingExpense = transactions
        .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Resumen General</h2>
                    <p className="text-sm text-slate-400 mt-1 italic">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title="Ingresos Totales"
                    amount={totalIncome}
                    type="income"
                    currency={settings.currency}
                    symbol={currencySymbol}
                />
                <SummaryCard
                    title="Gastos Totales"
                    amount={totalExpense}
                    type="expense"
                    currency={settings.currency}
                    symbol={currencySymbol}
                />
                <SummaryCard
                    title="Balance Neto"
                    amount={netBalance}
                    type="neutral"
                    isNet={true}
                    currency={settings.currency}
                    symbol={currencySymbol}
                />
            </div>

            {/* Pending Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Por Cobrar</h3>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(pendingIncome, settings.currency, currencySymbol)}</p>
                    <p className="text-sm text-slate-400 mt-2">{transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').length} transacciones pendientes</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Por Pagar</h3>
                    <p className="text-3xl font-bold text-orange-600">{formatCurrency(pendingExpense, settings.currency, currencySymbol)}</p>
                    <p className="text-sm text-slate-400 mt-2">{transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').length} facturas pendientes</p>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, amount, type, symbol, currency, isNet = false }: { title: string, amount: number, type: 'income' | 'expense' | 'neutral', symbol: string, currency?: string, isNet?: boolean }) {
    let colorClass = 'text-slate-800';
    let bgClass = 'bg-white';

    if (type === 'income') {
        colorClass = 'text-emerald-600';
        bgClass = 'bg-white';
    } else if (type === 'expense') {
        colorClass = 'text-rose-600';
    } else if (isNet) {
        colorClass = amount >= 0 ? 'text-emerald-600' : 'text-rose-600';
    }

    return (
        <div className={`${bgClass} p-6 rounded-2xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1`}>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
            <p className={`text-4xl font-extrabold ${colorClass}`}>
                {formatCurrency(Math.abs(amount), currency || 'DOP', symbol)}
            </p>
        </div>
    );
}
