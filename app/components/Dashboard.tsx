'use client';

import { useState, useEffect } from 'react';
import { useTransactions, useSettings } from '@/app/lib/hooks';
import { formatCurrency, parseLocalDate } from '@/app/lib/utils';

export default function Dashboard() {
    const { transactions, loading } = useTransactions();
    const { settings } = useSettings();
    // Default to KATHCAKE as requested
    const [view, setView] = useState<'ALL' | 'PERSONAL' | 'KATHCAKE'>('KATHCAKE');
    const [selectedYear, setSelectedYear] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('kathcake_selected_year');
            return saved ? parseInt(saved) : new Date().getFullYear();
        }
        return new Date().getFullYear();
    });

    // Persist year choice
    useEffect(() => {
        localStorage.setItem('kathcake_selected_year', selectedYear.toString());
    }, [selectedYear]);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando datos...</div>;
    }

    const { currencySymbol } = settings;

    // Filter transactions based on view and year
    const filteredTransactions = transactions.filter(t => {
        const isYearMatch = parseLocalDate(t.date).getFullYear() === selectedYear;
        if (!isYearMatch) return false;

        if (view === 'ALL') return true;
        if (view === 'KATHCAKE') return t.transactionCategory === 'KATHCAKE' || !t.transactionCategory;
        return t.transactionCategory === view;
    });

    // Get list of available years for the selector
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>();

    // Add years with data
    transactions.forEach(t => yearsSet.add(parseLocalDate(t.date).getFullYear()));

    // Add a generous range around the current year
    for (let y = 2024; y <= 2040; y++) {
        yearsSet.add(y);
    }

    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
    const availableYearsAsc = Array.from(yearsSet).sort((a, b) => a - b);

    // Calculate Totals using filtered transactions
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'INCOME' && t.status === 'PAID')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Resumen Financiero</h2>
                    <p className="text-sm text-slate-400 mt-1 italic">
                        Kathcake Business • {selectedYear}
                    </p>
                </div>

                <div className="flex gap-4 items-center">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2 font-semibold shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title={`Ventas Kathcake ${selectedYear}`}
                    amount={totalIncome}
                    type="income"
                    currency={settings.currency}
                    symbol={currencySymbol}
                />
                <SummaryCard
                    title={`Gastos Kathcake ${selectedYear}`}
                    amount={totalExpense}
                    type="expense"
                    currency={settings.currency}
                    symbol={currencySymbol}
                />
                <SummaryCard
                    title="Utilidad Neta"
                    amount={netBalance}
                    type="neutral"
                    isNet={true}
                    currency={settings.currency}
                    symbol={currencySymbol}
                />
            </div>

            {/* Annual & Monthly Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Annual Summary */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Resumen Ventas y Gastos Anuales</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 text-left">
                                    <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Año</th>
                                    <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ventas</th>
                                    <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Gastos</th>
                                    <th className="py-3 text-[10px] font-bold text-sky-600 uppercase tracking-wider text-right">Ahorro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {availableYearsAsc
                                    .filter(y => y >= selectedYear) // Start from selected year like in screenshot
                                    .slice(0, 12) // Show next 12 years
                                    .map(year => {
                                        // Calculate totals for this specific year
                                        const yearTransactions = transactions.filter(t => {
                                            const tYear = parseLocalDate(t.date).getFullYear();
                                            if (tYear !== year) return false;
                                            if (view === 'ALL') return true;
                                            if (view === 'KATHCAKE') return t.transactionCategory === 'KATHCAKE' || !t.transactionCategory;
                                            return t.transactionCategory === view;
                                        });

                                        const yearIncome = yearTransactions
                                            .filter(t => t.type === 'INCOME' && t.status === 'PAID')
                                            .reduce((sum, t) => sum + t.amount, 0);

                                        const yearExpense = yearTransactions
                                            .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
                                            .reduce((sum, t) => sum + t.amount, 0);

                                        const yearNet = yearIncome - yearExpense;

                                        // Skip years with absolutely no data if you prefer, 
                                        // but usually users want to see the row if the year is in the list

                                        return (
                                            <tr key={year} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 text-xs font-bold text-slate-700">{year}</td>
                                                <td className="py-3 text-xs font-bold text-emerald-500 text-right">{formatCurrency(yearIncome, settings.currency, currencySymbol)}</td>
                                                <td className="py-3 text-xs font-bold text-rose-500 text-right">{formatCurrency(yearExpense, settings.currency, currencySymbol)}</td>
                                                <td className="py-3 text-xs font-bold text-sky-600 text-right">{formatCurrency(yearNet, settings.currency, currencySymbol)}</td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Monthly Summary */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Resumen Ventas y Gastos Mensuales</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 text-left">
                                    <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mes</th>
                                    <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ventas</th>
                                    <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Gastos</th>
                                    <th className="py-3 text-[10px] font-bold text-sky-600 uppercase tracking-wider text-right">Ahorro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {Array.from({ length: 12 }, (_, i) => i).map(monthIndex => {
                                    const monthName = new Date(selectedYear, monthIndex).toLocaleString('es-ES', { month: 'long' });
                                    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

                                    // Calculate totals for this month in the selected year
                                    // We can reuse filteredTransactions since it's already filtered by selectedYear
                                    const monthTransactions = filteredTransactions.filter(t => {
                                        return parseLocalDate(t.date).getMonth() === monthIndex;
                                    });

                                    const monthIncome = monthTransactions
                                        .filter(t => t.type === 'INCOME' && t.status === 'PAID')
                                        .reduce((sum, t) => sum + t.amount, 0);

                                    const monthExpense = monthTransactions
                                        .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
                                        .reduce((sum, t) => sum + t.amount, 0);

                                    const monthNet = monthIncome - monthExpense;

                                    return (
                                        <tr key={monthIndex} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 text-xs font-bold text-slate-700">{capitalizedMonth}</td>
                                            <td className="py-3 text-xs font-bold text-emerald-500 text-right">{formatCurrency(monthIncome, settings.currency, currencySymbol)}</td>
                                            <td className="py-3 text-xs font-bold text-rose-500 text-right">{formatCurrency(monthExpense, settings.currency, currencySymbol)}</td>
                                            <td className="py-3 text-xs font-bold text-sky-600 text-right">{formatCurrency(monthNet, settings.currency, currencySymbol)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detailed Grouped Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ventas Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-emerald-600 p-4">
                        <h3 className="text-white font-bold text-center uppercase tracking-widest text-sm">
                            Detalle de Ventas {selectedYear}
                        </h3>
                    </div>
                    <div className="bg-emerald-500/10 grid grid-cols-2 border-b border-emerald-100 italic">
                        <div className="p-2 text-emerald-800 font-bold text-xs text-center border-r border-emerald-100">PRODUCTO / SERVICIO</div>
                        <div className="p-2 text-emerald-800 font-bold text-xs text-center">MONTO</div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
                        {(function () {
                            const salesData = filteredTransactions
                                .filter(t => t.type === 'INCOME')
                                .reduce((acc, t) => {
                                    const key = t.description || 'Otros Ingresos';
                                    acc[key] = (acc[key] || 0) + t.amount;
                                    return acc;
                                }, {} as Record<string, number>);

                            const sortedSales = Object.entries(salesData).sort((a, b) => b[1] - a[1]);

                            if (sortedSales.length === 0) return <p className="p-6 text-center text-slate-400 text-xs italic">No hay ventas registradas.</p>;

                            return sortedSales.map(([name, total], index) => (
                                <div key={name} className={`grid grid-cols-2 ${index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                    <div className="p-3 text-[11px] font-bold text-slate-600 uppercase border-r border-slate-100">{name}</div>
                                    <div className="p-3 text-[11px] font-bold text-slate-700 text-right">{formatCurrency(total, settings.currency, currencySymbol)}</div>
                                </div>
                            ));
                        })()}
                    </div>
                    <div className="bg-emerald-600 grid grid-cols-2 p-3">
                        <div className="text-white font-black text-xs uppercase text-center">Total de Ventas</div>
                        <div className="text-white font-black text-xs text-right">{formatCurrency(totalIncome, settings.currency, currencySymbol)}</div>
                    </div>
                </div>

                {/* Gastos Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-rose-600 p-4">
                        <h3 className="text-white font-bold text-center uppercase tracking-widest text-sm">
                            Detalle de Gastos {selectedYear}
                        </h3>
                    </div>
                    <div className="bg-rose-500/10 grid grid-cols-2 border-b border-rose-100 italic">
                        <div className="p-2 text-rose-800 font-bold text-xs text-center border-r border-rose-100">DESCRIPCIÓN GASTO</div>
                        <div className="p-2 text-rose-800 font-bold text-xs text-center">MONTO</div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
                        {(function () {
                            const expenseData = filteredTransactions
                                .filter(t => t.type === 'EXPENSE')
                                .reduce((acc, t) => {
                                    const key = t.description || 'Otros Gastos';
                                    acc[key] = (acc[key] || 0) + t.amount;
                                    return acc;
                                }, {} as Record<string, number>);

                            const sortedExpenses = Object.entries(expenseData).sort((a, b) => b[1] - a[1]);

                            if (sortedExpenses.length === 0) return <p className="p-6 text-center text-slate-400 text-xs italic">No hay gastos registrados.</p>;

                            return sortedExpenses.map(([name, total], index) => (
                                <div key={name} className={`grid grid-cols-2 ${index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                    <div className="p-3 text-[11px] font-bold text-slate-600 uppercase border-r border-slate-100">{name}</div>
                                    <div className="p-3 text-[11px] font-bold text-slate-700 text-right">{formatCurrency(total, settings.currency, currencySymbol)}</div>
                                </div>
                            ));
                        })()}
                    </div>
                    <div className="bg-rose-600 grid grid-cols-2 p-3">
                        <div className="text-white font-black text-xs uppercase text-center">Total de Gastos</div>
                        <div className="text-white font-black text-xs text-right">{formatCurrency(totalExpense, settings.currency, currencySymbol)}</div>
                    </div>
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
            <p className={`text-3xl font-extrabold ${colorClass}`}>
                {formatCurrency(Math.abs(amount), currency || 'DOP', symbol)}
            </p>
        </div>
    );
}
