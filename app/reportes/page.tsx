'use client';

import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useTransactions, useSettings } from '../lib/hooks';
import { formatCurrency, parseLocalDate } from '@/app/lib/utils';

export default function ReportesPage() {
    // We fetch all transactions but filter for Kathcake + Uncategorized as business data
    const { transactions, loading } = useTransactions();
    const { settings } = useSettings();
    const { currencySymbol } = settings;
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- Business Logic Integration ---
    const businessTransactions = useMemo(() => {
        // As per USER request, Reports is for Kathcake. 
        // We include explicit KATHCAKE items OR uncategorized items (old data/default)
        return transactions.filter(t => t.transactionCategory === 'KATHCAKE' || !t.transactionCategory);
    }, [transactions]);

    // --- Aggregation Logic (Uses businessTransactions) ---

    // 1. Annual Summary
    const annualSummary = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const yearsSet = new Set([currentYear, currentYear + 1]);
        businessTransactions.forEach(t => yearsSet.add(parseLocalDate(t.date).getFullYear()));

        const years = Array.from(yearsSet).sort((a, b) => b - a);

        return years.map(year => {
            const yearTrans = businessTransactions.filter(t => parseLocalDate(t.date).getFullYear() === year && t.status === 'PAID');
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
                return d.getFullYear() === selectedYear && d.getMonth() === month && t.status === 'PAID';
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
                    className="w-48 h-48 rounded-full border-4 border-white shadow-lg"
                    style={{ background: `conic-gradient(${gradientParts})` }}
                ></div>

                <div className="mt-6 w-full space-y-2">
                    {topItems.map((item, index) => (
                        <div key={item.name} className="flex justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: colorBase === 'emerald'
                                            ? ['#10B981', '#34D399', '#6EE7B7', '#059669', '#047857', '#065F46'][index % 6]
                                            : ['#F43F5E', '#FB7185', '#FDA4AF', '#E11D48', '#BE123C', '#9F1239'][index % 6]
                                    }}
                                />
                                <span className="text-slate-600 truncate max-w-[120px]">{item.name}</span>
                            </div>
                            <span className="font-semibold text-slate-700">{Math.round((item.total / total) * 100)}% ({formatCurrency(item.total, settings.currency, currencySymbol)})</span>
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
                        <h2 className="text-3xl font-bold text-slate-800">Reportes Kathcake</h2>
                        <p className="text-slate-500">Análisis detallado del rendimiento de tu negocio.</p>
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

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* 1. Annual Summary Table */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-white bg-emerald-600 p-3 rounded-t-lg text-center uppercase tracking-wider">
                            Resumen Anual del Negocio
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-center">
                                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="py-3 px-2">Año</th>
                                        <th className="py-3 px-2">Ventas</th>
                                        <th className="py-3 px-2">Gastos</th>
                                        <th className="py-3 px-2">Utilidad Anual</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {annualSummary.map((row) => (
                                        <tr key={row.year} className={row.year === selectedYear ? 'bg-emerald-50' : ''}>
                                            <td className="py-3 font-bold text-slate-700">{row.year}</td>
                                            <td className="py-3 text-emerald-600 font-bold">{formatCurrency(row.sales, settings.currency, currencySymbol)}</td>
                                            <td className="py-3 text-rose-600 font-bold">{formatCurrency(row.expenses, settings.currency, currencySymbol)}</td>
                                            <td className={`py-3 font-bold ${row.savings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {formatCurrency(row.savings, settings.currency, currencySymbol)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. Monthly Summary Table */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center bg-slate-800 p-3 rounded-t-lg">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Flujo Mensual {selectedYear}</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-center">
                                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="py-3 px-2">Mes</th>
                                        <th className="py-3 px-2">Ventas</th>
                                        <th className="py-3 px-2">Gastos</th>
                                        <th className="py-3 px-2">Utilidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {monthlySummary.map((row) => (
                                        <tr key={row.monthName} className="hover:bg-slate-50">
                                            <td className="py-3 font-bold text-slate-700 capitalize text-left pl-4">{row.monthName}</td>
                                            <td className="py-3 text-slate-600">{row.sales > 0 ? formatCurrency(row.sales, settings.currency, currencySymbol) : '-'}</td>
                                            <td className="py-3 text-slate-600">{row.expenses > 0 ? formatCurrency(row.expenses, settings.currency, currencySymbol) : '-'}</td>
                                            <td className={`py-3 font-bold ${row.savings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {row.savings !== 0 ? formatCurrency(row.savings, settings.currency, currencySymbol) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* 3. Charts and Breakdowns */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Income Chart & List */}
                    <div className="space-y-6">
                        <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                            <h3 className="text-xl font-bold text-emerald-800 uppercase">Detalle de Ventas {selectedYear}</h3>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start">
                            {/* Chart */}
                            <div className="flex-shrink-0">
                                <PieChartCSS data={categoryBreakdown.income} colorBase="emerald" />
                            </div>

                            {/* List */}
                            <div className="flex-1 w-full overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800 text-white text-xs uppercase">
                                        <tr>
                                            <th className="py-2 px-3 text-left">Concepto</th>
                                            <th className="py-2 px-3 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {categoryBreakdown.income.map(item => (
                                            <tr key={item.name}>
                                                <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[200px]">{item.name}</td>
                                                <td className="py-2 px-3 text-right text-slate-600 whitespace-nowrap">{formatCurrency(item.total, settings.currency, currencySymbol)}</td>
                                            </tr>
                                        ))}
                                        {categoryBreakdown.income.length === 0 && (
                                            <tr><td colSpan={2} className="py-4 text-center text-slate-400">Sin ventas registradas</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Chart & List */}
                    <div className="space-y-6">
                        <div className="bg-rose-50 p-4 rounded-xl text-center border border-rose-100">
                            <h3 className="text-xl font-bold text-rose-800 uppercase">Detalle de Gastos {selectedYear}</h3>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start">
                            {/* Chart */}
                            <div className="flex-shrink-0">
                                <PieChartCSS data={categoryBreakdown.expense} colorBase="rose" />
                            </div>

                            {/* List */}
                            <div className="flex-1 w-full overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800 text-white text-xs uppercase">
                                        <tr>
                                            <th className="py-2 px-3 text-left">Concepto</th>
                                            <th className="py-2 px-3 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {categoryBreakdown.expense.map(item => (
                                            <tr key={item.name}>
                                                <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[200px]">{item.name}</td>
                                                <td className="py-2 px-3 text-right text-slate-600 whitespace-nowrap">{formatCurrency(item.total, settings.currency, currencySymbol)}</td>
                                            </tr>
                                        ))}
                                        {categoryBreakdown.expense.length === 0 && (
                                            <tr><td colSpan={2} className="py-4 text-center text-slate-400">Sin gastos registrados</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
