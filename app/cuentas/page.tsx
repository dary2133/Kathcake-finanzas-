'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AccountForm from '../components/AccountForm';
import FixedExpenseForm from '../components/FixedExpenseForm';
import FixedIncomeForm from '../components/FixedIncomeForm';
import CardExpenseForm from '../components/CardExpenseForm';
import { useAccounts, useSettings, useFixedExpenses, useFixedIncomes } from '../lib/hooks';
import { formatCurrency } from '../lib/utils';
import { Account, FixedExpense, FixedIncome } from '../lib/types';

export default function CuentasPage() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const { accounts = [], refreshAccounts, removeAccount } = useAccounts('PERSONAL');
    const { fixedExpenses = [], refreshFixedExpenses, removeFixedExpense } = useFixedExpenses('PERSONAL');
    const { fixedIncomes = [], refreshFixedIncomes, removeFixedIncome } = useFixedIncomes('PERSONAL');
    const { settings = { currency: 'DOP', currencySymbol: 'RD$' } } = useSettings();
    const { currencySymbol = 'RD$', currency = 'DOP' } = settings || {};

    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);
    const [editingFixedIncome, setEditingFixedIncome] = useState<FixedIncome | null>(null);
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountFormSection, setAccountFormSection] = useState<'REGULAR' | 'CREDIT' | null>(null);
    const [showCardExpenseForm, setShowCardExpenseForm] = useState(false);
    const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
    const [showFixedIncomeForm, setShowFixedIncomeForm] = useState(false);

    const handleAccountSuccess = () => { setShowAccountForm(false); setAccountFormSection(null); setEditingAccount(null); refreshAccounts(); };
    const handleCardExpenseSuccess = () => { setShowCardExpenseForm(false); refreshAccounts(); };
    const handleFixedExpenseSuccess = () => { setShowFixedExpenseForm(false); setEditingFixedExpense(null); refreshFixedExpenses(); };
    const handleFixedIncomeSuccess = () => { setShowFixedIncomeForm(false); setEditingFixedIncome(null); refreshFixedIncomes(); };

    // Filtros y Cálculos con máxima seguridad
    const safeAccounts = Array.isArray(accounts) ? accounts.filter(Boolean) : [];
    const safeExpenses = Array.isArray(fixedExpenses) ? fixedExpenses.filter(Boolean) : [];
    const safeIncomes = Array.isArray(fixedIncomes) ? fixedIncomes.filter(Boolean) : [];

    const liquidFunds = safeAccounts.filter(a => a.type !== 'CREDIT');
    const creditCards = safeAccounts.filter(a => a.type === 'CREDIT');
    const totalFunds = liquidFunds.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const totalDebt = creditCards.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const totalFixedIncome = safeIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalFixedExpense = safeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netMonthlyFlow = totalFixedIncome - totalFixedExpense;

    if (!isMounted) return <Layout><div className="p-20 text-center text-slate-400">Cargando...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-10 pb-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Cuentas Personales</h2>
                        <p className="text-slate-500 text-sm">Finanzas compartidas y personales</p>
                    </div>
                </div>

                {/* RESUMEN SUPERIOR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* TOTAL ACTIVOS CARD */}
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-full bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="text-6xl font-black text-emerald-900">$</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-emerald-800 font-bold uppercase text-[11px] tracking-widest mb-1">Total Activos</h3>
                            <p className="text-3xl font-black text-emerald-500 tracking-tight">{formatCurrency(totalFunds, currency, currencySymbol)}</p>
                        </div>

                        {/* Breakdown of Current Assets */}
                        <div className="mt-4 pt-3 border-t border-emerald-100/50 space-y-2">
                            <p className="text-[10px] uppercase font-bold text-emerald-800/40 tracking-wider">Disponible en cuentas</p>
                            <div className="space-y-1.5">
                                {liquidFunds.length === 0 ? <p className="text-[10px] text-slate-400 italic">No hay cuentas registradas</p> :
                                    liquidFunds.map(acc => (
                                        <div key={acc.id} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                <span className="text-slate-600 font-medium truncate max-w-[120px]">{acc.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-700">{formatCurrency(acc.balance, currency, currencySymbol)}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Upcoming Assets Section */}
                        <div className="mt-4 pt-3 border-t border-emerald-100/50 space-y-2">
                            <p className="text-[10px] uppercase font-bold text-emerald-800/40 tracking-wider">Próximos Ingresos</p>
                            <div className="space-y-2">
                                {(function () {
                                    const currentDay = new Date().getDate();
                                    const sortedIncomes = safeIncomes
                                        .map(inco => {
                                            const payDay = inco.paymentDay || 1;
                                            let daysDiff = payDay - currentDay;
                                            if (daysDiff <= 0) daysDiff += 30; // Approximation for next month
                                            return { ...inco, daysDiff };
                                        })
                                        .sort((a, b) => a.daysDiff - b.daysDiff)
                                        .slice(0, 3); // Show top 3 next incomes

                                    if (sortedIncomes.length === 0) return <p className="text-[10px] text-slate-400 italic">No hay ingresos fijos</p>;

                                    return sortedIncomes.map(inc => (
                                        <div key={inc.id} className="bg-white/60 p-2 rounded-lg border border-emerald-100/50 flex justify-between items-center group/item hover:border-emerald-200 transition-colors">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-700 leading-tight">{inc.name}</p>
                                                <p className="text-[9px] text-emerald-600 font-medium">
                                                    Faltan {inc.daysDiff} días <span className="text-slate-300">|</span> Día {inc.paymentDay}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700 border border-emerald-100">
                                                +{formatCurrency(inc.amount, currency, currencySymbol)}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* PASIVOS CARD */}
                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl shadow-sm flex flex-col h-full bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="text-6xl font-black text-rose-900">%</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-rose-800 font-bold uppercase text-[11px] tracking-widest mb-1">Pasivos (Tarjetas)</h3>
                            <p className="text-3xl font-black text-rose-500 tracking-tight">{formatCurrency(totalDebt, currency, currencySymbol)}</p>
                        </div>

                        {/* Breakdown of Liabilities */}
                        <div className="mt-4 pt-3 border-t border-rose-100/50 space-y-2">
                            <p className="text-[10px] uppercase font-bold text-rose-800/40 tracking-wider">Desglose de deudas</p>
                            <div className="space-y-1.5">
                                {creditCards.length === 0 ? <p className="text-[10px] text-slate-400 italic">No hay deudas de tarjetas</p> :
                                    creditCards.map(card => (
                                        <div key={card.id} className="flex justify-between items-center text-xs group/card">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 group-hover/card:animate-pulse"></div>
                                                <span className="text-slate-600 font-medium truncate max-w-[120px]">{card.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-rose-600 block">{formatCurrency(card.balance, currency, currencySymbol)}</span>
                                                {/* Optional: Show limit usage percentage if desired, keeping it simple for now to match style */}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Summary of Available Credit (Optional but useful for Pasivos card filler) */}
                        <div className="mt-auto pt-4">
                            <div className="bg-rose-100/30 p-2 rounded-lg border border-rose-100 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-rose-800 uppercase">Total Línea Crédito</span>
                                <span className="text-[10px] font-black text-rose-700">
                                    {formatCurrency(creditCards.reduce((sum, c) => sum + (Number(c.limit) || 0), 0), currency, currencySymbol)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-sm border ${netMonthlyFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                        <h3 className={`font-bold uppercase text-[11px] mb-1 ${netMonthlyFlow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Flujo Neto Mensual</h3>
                        <p className={`text-2xl font-black ${netMonthlyFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(netMonthlyFlow, currency, currencySymbol)}</p>

                        {/* ANÁLISIS DINÁMICO DE PERIODOS */}
                        <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-xs space-y-3">
                            {(function () {
                                if (safeIncomes.length === 0) return <p className="text-slate-400 italic">Agrega ingresos para ver el desglose por periodo.</p>;

                                const incomeDays = Array.from(new Set(safeIncomes.map(i => i.paymentDay || 1))).sort((a, b) => a - b);

                                return incomeDays.map((startDay, index) => {
                                    const nextStartDay = incomeDays[(index + 1) % incomeDays.length];
                                    const isLast = index === incomeDays.length - 1;
                                    const rangeLabel = isLast ? `Periodo: Día ${startDay} al ${nextStartDay > 1 ? nextStartDay - 1 : 30} (prox. mes)` : `Periodo: Día ${startDay} al ${nextStartDay - 1}`;

                                    const periodIncome = safeIncomes.filter(i => (i.paymentDay || 1) === startDay).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

                                    const expensesInPeriod = safeExpenses.filter(exp => {
                                        const day = exp.paymentLimitDay || 1;
                                        if (startDay < nextStartDay) return day >= startDay && day < nextStartDay;
                                        else return day >= startDay || day < nextStartDay;
                                    });

                                    const periodExpenseTotal = expensesInPeriod.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                                    const balance = periodIncome - periodExpenseTotal;
                                    const expenseNames = expensesInPeriod.map(e => e.name).join(', ');

                                    return (
                                        <div key={startDay} className="bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm relative group/period">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-tight">{rangeLabel}</span>
                                                <span className={`font-bold text-[11px] ${balance >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                    Dispo: {formatCurrency(balance, currency, currencySymbol)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-emerald-600 font-bold text-[10px]">Ingresos (+{formatCurrency(periodIncome, currency, currencySymbol)})</p>
                                                </div>
                                                <div className="relative group/tooltip text-right">
                                                    <p className="text-rose-500 font-bold text-[10px] cursor-help">Gastos (-{formatCurrency(periodExpenseTotal, currency, currencySymbol)})</p>
                                                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{expenseNames || 'Sin gastos'}</p>

                                                    {expensesInPeriod.length > 0 && (
                                                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-slate-900 text-white p-3 rounded-xl shadow-2xl z-50 min-w-[220px] text-left border border-slate-700 backdrop-blur-md">
                                                            <p className="font-bold border-b border-white/10 mb-2 pb-1 text-[10px] uppercase tracking-widest text-slate-400">Desglose del periodo:</p>
                                                            <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                                                                {expensesInPeriod.map(e => (
                                                                    <div key={e.id} className="flex justify-between gap-4 text-[10px]">
                                                                        <span className="text-slate-300 font-medium">{e.name}</span>
                                                                        <span className="font-mono text-rose-300 font-bold">{formatCurrency(e.amount, currency, currencySymbol)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute top-full right-4 w-2 h-2 bg-slate-900 rotate-45 -translate-y-1"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        {/* SECCIÓN INGRESOS */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h4 className="font-bold text-slate-700">Ingresos Fijos</h4>
                                <button onClick={() => setShowFixedIncomeForm(true)} className="text-xs text-blue-600 font-bold">+ AGREGAR</button>
                            </div>
                            {showFixedIncomeForm && (
                                <div className="p-4 border-b"><FixedIncomeForm defaultCategory="PERSONAL" initialData={editingFixedIncome} onSuccess={handleFixedIncomeSuccess} onCancel={() => setShowFixedIncomeForm(false)} /></div>
                            )}
                            <div className="divide-y divide-slate-50">
                                {safeIncomes.length === 0 ? <p className="p-8 text-center text-slate-400 text-sm">No hay ingresos fijos.</p> :
                                    safeIncomes.map(income => (
                                        <div key={income.id} className="p-4 flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-slate-800">{income.name}</p>
                                                <p className="text-xs text-slate-400">Día de cobro: {income.paymentDay || '-'}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-emerald-600">{formatCurrency(income.amount, currency, currencySymbol)}</span>
                                                <button onClick={() => { setEditingFixedIncome(income); setShowFixedIncomeForm(true); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-500 transition-all">✎</button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>

                        {/* SECCIÓN GASTOS */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h4 className="font-bold text-slate-700">Gastos Fijos</h4>
                                <button onClick={() => setShowFixedExpenseForm(true)} className="text-xs text-rose-600 font-bold">+ AGREGAR</button>
                            </div>
                            {showFixedExpenseForm && (
                                <div className="p-4 border-b"><FixedExpenseForm defaultCategory="PERSONAL" initialData={editingFixedExpense} onSuccess={handleFixedExpenseSuccess} onCancel={() => setShowFixedExpenseForm(false)} /></div>
                            )}
                            <div className="divide-y divide-slate-50 text-sm">
                                {safeExpenses.length === 0 ? <p className="p-8 text-center text-slate-400">No hay gastos fijos.</p> :
                                    safeExpenses.map(expense => {
                                        const today = new Date().getDate();
                                        const day = expense.paymentLimitDay || 0;
                                        // Urgency: if due day is today or within next 5 days
                                        const diff = day - today;
                                        const isUrgent = diff >= 0 && diff <= 5;

                                        return (
                                            <div key={expense.id} className="p-4 flex justify-between items-center group">
                                                <div>
                                                    <p className="font-medium text-slate-800">{expense.name}</p>
                                                    <p className={`text-[10px] uppercase ${isUrgent ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                                        Vence: Día {day || '-'} {isUrgent && '⚠️'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-rose-500">-{formatCurrency(expense.amount, currency, currencySymbol)}</span>
                                                    <button onClick={() => { setEditingFixedExpense(expense); setShowFixedExpenseForm(true); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-500 transition-all">✎</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        {/* SECCIÓN CUENTAS */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h4 className="font-bold text-slate-700">Disponibilidad (Cuentas)</h4>
                                <button onClick={() => setShowAccountForm(true)} className="text-xs text-blue-600 font-bold">+ NUEVA</button>
                            </div>
                            {showAccountForm && (
                                <div className="p-4 border-b"><AccountForm defaultType="BANK" defaultCategory="PERSONAL" initialData={editingAccount} onSuccess={handleAccountSuccess} onCancel={() => setShowAccountForm(false)} /></div>
                            )}
                            <div className="p-2 grid grid-cols-1 gap-2">
                                {liquidFunds.map(account => (
                                    <div key={account.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center group">
                                        <div>
                                            <span className="font-medium text-slate-700 block">{account.name}</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(account.balance, currency, currencySymbol)}</span>
                                        </div>
                                        <button
                                            onClick={() => { setEditingAccount(account); setShowAccountForm(true); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 transition-all font-bold text-xs bg-white border border-slate-200 rounded-lg shadow-sm"
                                        >
                                            EDITAR
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SECCIÓN TARJETAS */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h4 className="font-bold text-slate-700">Deudas (Tarjetas)</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCardExpenseForm(true)} className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded">💳 CONSUMO</button>
                                    <button onClick={() => { setAccountFormSection('CREDIT'); setShowAccountForm(true); }} className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">+ TARJETA</button>
                                </div>
                            </div>
                            {showCardExpenseForm && (
                                <div className="p-4 border-b"><CardExpenseForm creditCards={creditCards} onSuccess={handleCardExpenseSuccess} onCancel={() => setShowCardExpenseForm(false)} /></div>
                            )}
                            <div className="p-4 space-y-4">
                                {creditCards.map(card => (
                                    <div key={card.id} className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg overflow-hidden">
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] uppercase opacity-60 font-medium tracking-widest">{card.name}</p>
                                                <p className="text-xl font-bold mt-1">{formatCurrency(card.balance, currency, currencySymbol)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase opacity-60 font-medium">Límite</p>
                                                <p className="text-sm font-bold">{formatCurrency(card.limit || 0, currency, currencySymbol)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (((card.limit || 0) - card.balance) / (card.limit || 1)) * 100)}%` }}></div>
                                        </div>
                                        <p className="mt-2 text-[10px] opacity-60">Disponible: {formatCurrency((card.limit || 0) - card.balance, currency, currencySymbol)}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
