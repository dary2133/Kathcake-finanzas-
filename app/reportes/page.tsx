'use client';

import { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import { useTransactions, useSettings } from '../lib/hooks';
import { formatCurrency, parseLocalDate } from '@/app/lib/utils';

export default function ReportesPage() {
    // We fetch all transactions but filter for Kathcake + Uncategorized as business data
    const { transactions, loading } = useTransactions();
    const { settings } = useSettings();
    const { currencySymbol } = settings;
    const [selectedYear, setSelectedYear] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('kathcake_selected_year');
            return saved ? parseInt(saved) : new Date().getFullYear();
        }
        return new Date().getFullYear();
    });

    // Sync with other pages and persist
    useEffect(() => {
        localStorage.setItem('kathcake_selected_year', selectedYear.toString());
    }, [selectedYear]);

    // --- Business Logic Integration ---
    const businessTransactions = useMemo(() => {
        // As per USER request, Reports is for Kathcake. 
        // We include explicit KATHCAKE items OR uncategorized items (old data/default)
        return transactions.filter(t => t.transactionCategory === 'KATHCAKE' || !t.transactionCategory);
    }, [transactions]);

    // --- Aggregation Logic (Uses businessTransactions) ---

    // 1. Annual Summary
    const annualSummary = useMemo(() => {
        const yearsSet = new Set<number>();

        // Add years with data
        businessTransactions.forEach(t => yearsSet.add(parseLocalDate(t.date).getFullYear()));

        // Add a generous range
        for (let y = 2020; y <= 2035; y++) {
            yearsSet.add(y);
        }

        const currentYear = new Date().getFullYear();
        const years = Array.from(yearsSet).sort((a, b) => b - a);

        return years.map(year => {
            // Remove PAID filter to show all activity in historical summary
            const yearTrans = businessTransactions.filter(t => parseLocalDate(t.date).getFullYear() === year);
            const sales = yearTrans.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
            const expenses = yearTrans.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
            return { year, sales, expenses, savings: sales - expenses };
        });
    }, [businessTransactions]);

    // 2. Monthly Summary (for Selected Year)
    const monthlySummary = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => i); // 0-11

        return months.map(month => {
            const monthTrans = businessTransactions.filter(t => {
                const d = parseLocalDate(t.date);
                return d.getFullYear() === selectedYear && d.getMonth() === month;
            });

            const sales = monthTrans.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
            const expenses = monthTrans.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

            return {
                monthName: new Date(selectedYear, month, 1).toLocaleDateString('es-ES', { month: 'long' }),
                sales,
                expenses,
                savings: sales - expenses
            };
        });
    }, [businessTransactions, selectedYear]);

    // 3. Category Breakdown (for Selected Year)
    const categoryBreakdown = useMemo(() => {
        const yearTrans = businessTransactions.filter(t => parseLocalDate(t.date).getFullYear() === selectedYear && t.status === 'PAID');

        const groupByCategory = (type: 'INCOME' | 'EXPENSE') => {
            const groups: Record<string, number> = {};
            yearTrans.filter(t => t.type === type).forEach(t => {
                const key = t.description || t.category || 'Otros';
                groups[key] = (groups[key] || 0) + t.amount;
            });
            return Object.entries(groups)
                .map(([name, total]) => ({ name, total }))
                .sort((a, b) => b.total - a.total);
        };

        return {
            income: groupByCategory('INCOME'),
            expense: groupByCategory('EXPENSE')
        };
    }, [businessTransactions, selectedYear]);


    // --- Helper Components ---

    const PieChartCSS = ({ data, colorBase }: { data: { name: string; total: number }[], colorBase: 'emerald' | 'rose' }) => {
        if (data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-400">Sin datos</div>;

        const total = data.reduce((sum, d) => sum + d.total, 0);
        let accumulatedDeg = 0;

        // Limit to top 5
        const topItems = data.slice(0, 5);
        const otherTotal = data.slice(5).reduce((sum, d) => sum + d.total, 0);
        if (otherTotal > 0) topItems.push({ name: 'Otros', total: otherTotal });

        const gradientParts = topItems.map((item, index) => {
            const percent = item.total / total;
            const deg = percent * 360;
            const start = accumulatedDeg;
            accumulatedDeg += deg;

            const colors = colorBase === 'emerald'
                ? ['#10B981', '#34D399', '#6EE7B7', '#059669', '#047857', '#065F46']
                : ['#F43F5E', '#FB7185', '#FDA4AF', '#E11D48', '#BE123C', '#9F1239'];

            return `${colors[index % colors.length]} ${start}deg ${accumulatedDeg}deg`;
        }).join(', ');

        return (
            <div className="flex flex-col items-center">
                <div
                    className="w-48 h-48 rounded-full border-8 border-white shadow-xl relative flex items-center justify-center transition-transform hover:scale-105 duration-500"
                    style={{ background: `conic-gradient(${gradientParts})` }}
                >
                    {/* Donut hole for premium look */}
                    <div className="absolute w-32 h-32 bg-white rounded-full shadow-inner flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total</span>
                        <span className="text-sm font-black text-slate-800">{formatCurrency(total, settings.currency, currencySymbol)}</span>
                    </div>
                </div>

                <div className="mt-8 w-full space-y-3">
                    {topItems.map((item, index) => (
                        <div key={item.name} className="flex justify-between items-center group/item cursor-default">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-md shadow-sm transform transition-transform group-hover/item:scale-125"
                                    style={{
                                        backgroundColor: colorBase === 'emerald'
                                            ? ['#10B981', '#34D399', '#6EE7B7', '#059669', '#047857', '#065F46'][index % 6]
                                            : ['#F43F5E', '#FB7185', '#FDA4AF', '#E11D48', '#BE123C', '#9F1239'][index % 6]
                                    }}
                                />
                                <span className="text-slate-600 text-xs font-semibold group-hover/item:text-slate-900 transition-colors truncate max-w-[140px] uppercase tracking-tighter">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-slate-800 leading-none">{formatCurrency(item.total, settings.currency, currencySymbol)}</p>
                                <p className="text-[9px] text-slate-400 font-bold">{Math.round((item.total / total) * 100)}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Reportes Kathcake</h2>
                        <p className="text-slate-500 text-sm">Análisis detallado del rendimiento de tu negocio.</p>
                    </div>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2 font-semibold shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                        {annualSummary.map(y => (
                            <option key={y.year} value={y.year}>{y.year}</option>
                        ))}
                    </select>
                </div>

                {/* SECTION 1: DETAILED BREAKDOWN (VISUAL FIRST) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Income Chart & List */}
                    <div className="space-y-6">
                        <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-100 flex justify-between items-center text-white">
                            <h3 className="text-lg font-black uppercase tracking-widest">Detalle Ventas {selectedYear}</h3>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col md:flex-row gap-10 items-center md:items-start">
                            {/* Chart */}
                            <div className="flex-shrink-0">
                                <PieChartCSS data={categoryBreakdown.income} colorBase="emerald" />
                            </div>

                            {/* List */}
                            <div className="flex-1 w-full overflow-hidden">
                                <div className="rounded-xl overflow-hidden border border-slate-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
                                            <tr>
                                                <th className="py-3 px-4 text-left">Concepto</th>
                                                <th className="py-3 px-4 text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {categoryBreakdown.income.map(item => (
                                                <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 px-4 text-slate-700 font-black text-xs uppercase truncate max-w-[150px]">{item.name}</td>
                                                    <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900">{formatCurrency(item.total, settings.currency, currencySymbol)}</td>
                                                </tr>
                                            ))}
                                            {categoryBreakdown.income.length === 0 && (
                                                <tr><td colSpan={2} className="py-10 text-center text-slate-400 italic text-xs">Sin ventas para este año</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Chart & List */}
                    <div className="space-y-6">
                        <div className="bg-rose-600 p-4 rounded-2xl shadow-lg shadow-rose-100 flex justify-between items-center text-white">
                            <h3 className="text-lg font-black uppercase tracking-widest">Detalle Gastos {selectedYear}</h3>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col md:flex-row gap-10 items-center md:items-start">
                            {/* Chart */}
                            <div className="flex-shrink-0">
                                <PieChartCSS data={categoryBreakdown.expense} colorBase="rose" />
                            </div>

                            {/* List */}
                            <div className="flex-1 w-full overflow-hidden">
                                <div className="rounded-xl overflow-hidden border border-slate-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
                                            <tr>
                                                <th className="py-3 px-4 text-left">Concepto</th>
                                                <th className="py-3 px-4 text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {categoryBreakdown.expense.map(item => (
                                                <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 px-4 text-slate-700 font-black text-xs uppercase truncate max-w-[150px]">{item.name}</td>
                                                    <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900">{formatCurrency(item.total, settings.currency, currencySymbol)}</td>
                                                </tr>
                                            ))}
                                            {categoryBreakdown.expense.length === 0 && (
                                                <tr><td colSpan={2} className="py-10 text-center text-slate-400 italic text-xs">Sin gastos para este año</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: HISTORICAL TABLES (NOW BELOW) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* 1. Annual Summary Table */}
                    <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 flex flex-col h-[500px]">
                        <div className="bg-slate-900 text-white p-4 rounded-2xl mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-center">Resumen Anual Histórico</h3>
                        </div>
                        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                            <table className="w-full text-center border-separate border-spacing-y-2">
                                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black sticky top-0 z-10">
                                    <tr>
                                        <th className="py-4 px-2">Año</th>
                                        <th className="py-4 px-2">Ventas</th>
                                        <th className="py-4 px-2">Gastos</th>
                                        <th className="py-4 px-2">Utilidad</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    {annualSummary
                                        .filter(row => row.sales > 0 || row.expenses > 0 || row.year === selectedYear || row.year === new Date().getFullYear())
                                        .map((row) => (
                                            <tr key={row.year} className={`${row.year === selectedYear ? 'bg-emerald-50 ring-2 ring-emerald-500/20' : 'bg-slate-50/50 hover:bg-slate-50'} rounded-xl transition-all`}>
                                                <td className="py-4 font-black text-slate-800 rounded-l-xl">{row.year}</td>
                                                <td className="py-4 text-emerald-600 font-bold">{formatCurrency(row.sales, settings.currency, currencySymbol)}</td>
                                                <td className="py-4 text-rose-500 font-bold">{formatCurrency(row.expenses, settings.currency, currencySymbol)}</td>
                                                <td className={`py-4 font-black rounded-r-xl ${row.savings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {formatCurrency(row.savings, settings.currency, currencySymbol)}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. Monthly Summary Table */}
                    <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 flex flex-col h-[500px]">
                        <div className="bg-slate-900 text-white p-4 rounded-2xl mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-center">Flujo Mensual {selectedYear}</h3>
                        </div>
                        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                            <table className="w-full text-center border-separate border-spacing-y-2">
                                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black sticky top-0 z-10">
                                    <tr>
                                        <th className="py-4 px-2">Mes</th>
                                        <th className="py-4 px-2">Ventas</th>
                                        <th className="py-4 px-2">Gastos</th>
                                        <th className="py-4 px-2">Utilidad</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    {monthlySummary.map((row) => (
                                        <tr key={row.monthName} className="bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all">
                                            <td className="py-4 font-black text-slate-800 capitalize text-left pl-6 rounded-l-xl">{row.monthName}</td>
                                            <td className="py-4 text-slate-600 font-bold">{formatCurrency(row.sales, settings.currency, currencySymbol)}</td>
                                            <td className="py-4 text-slate-600 font-bold">{formatCurrency(row.expenses, settings.currency, currencySymbol)}</td>
                                            <td className={`py-4 font-black rounded-r-xl ${row.savings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatCurrency(row.savings, settings.currency, currencySymbol)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </div>
        </Layout>
    );
}
