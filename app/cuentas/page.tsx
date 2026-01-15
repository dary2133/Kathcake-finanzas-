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
    const { settings } = useSettings();
    const { currencySymbol = 'RD$', currency = 'DOP' } = settings || {};

    // State for Forms
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);
    const [editingFixedIncome, setEditingFixedIncome] = useState<FixedIncome | null>(null);

    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountFormSection, setAccountFormSection] = useState<'REGULAR' | 'CREDIT' | null>(null);
    const [showCardExpenseForm, setShowCardExpenseForm] = useState(false);
    const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
    const [showFixedIncomeForm, setShowFixedIncomeForm] = useState(false);

    // Handlers
    const handleAccountSuccess = () => {
        setShowAccountForm(false);
        setAccountFormSection(null);
        setEditingAccount(null);
        refreshAccounts();
    };
    const handleCardExpenseSuccess = () => { setShowCardExpenseForm(false); refreshAccounts(); };
    const handleFixedExpenseSuccess = () => { setShowFixedExpenseForm(false); setEditingFixedExpense(null); refreshFixedExpenses(); };
    const handleFixedIncomeSuccess = () => { setShowFixedIncomeForm(false); setEditingFixedIncome(null); refreshFixedIncomes(); };

    // Group Accounts & Totals (with safety)
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const safeExpenses = Array.isArray(fixedExpenses) ? fixedExpenses : [];
    const safeIncomes = Array.isArray(fixedIncomes) ? fixedIncomes : [];

    const liquidFunds = safeAccounts.filter(a => a && (a.type === 'CASH' || a.type === 'BANK' || a.type === 'INVESTMENT'));
    const creditCards = safeAccounts.filter(a => a && a.type === 'CREDIT');
    const totalFunds = liquidFunds.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalDebt = creditCards.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalFixedIncome = safeIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalFixedExpense = safeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netMonthlyFlow = totalFixedIncome - totalFixedExpense;

    if (!isMounted) return <Layout><div className="p-20 text-center text-slate-400">Cargando...</div></Layout>;

    return (
        <Layout>
            <div className="space-y-10 pb-20">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Registro Financiero</h2>
                        <p className="text-slate-500">Vista general de tus compromisos fijos, deudas y disponibilidad.</p>
                    </div>
                </div>

                {/* TOP SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                        <h3 className="text-emerald-800 font-bold uppercase text-xs mb-2 tracking-wider">Total Disponible (Activos)</h3>
                        <p className="text-3xl font-extrabold text-emerald-600">{formatCurrency(totalFunds, currency, currencySymbol)}</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl">
                        <h3 className="text-rose-800 font-bold uppercase text-xs mb-2 tracking-wider">Deuda Total (Tarjetas)</h3>
                        <p className="text-3xl font-extrabold text-rose-600">{formatCurrency(totalDebt, currency, currencySymbol)}</p>
                    </div>
                    <div className={`border p-6 rounded-2xl ${netMonthlyFlow >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                        <h3 className={`${netMonthlyFlow >= 0 ? 'text-blue-800' : 'text-orange-800'} font-bold uppercase text-xs mb-2 tracking-wider`}>Flujo Neto Fijo Mensual</h3>
                        <p className={`text-3xl font-extrabold ${netMonthlyFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {netMonthlyFlow > 0 ? '+' : ''}{formatCurrency(netMonthlyFlow, currency, currencySymbol)}
                        </p>

                        {/* Dynamic Period Analysis */}
                        <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-xs space-y-4">
                            {(function () {
                                if (!safeIncomes || safeIncomes.length === 0) return <p className="text-slate-400 italic">Agrega ingresos para ver el desglose por periodo.</p>;

                                const incomeDays = Array.from(new Set(safeIncomes.map(i => i?.paymentDay || 1))).sort((a, b) => a - b);

                                return incomeDays.map((startDay, index) => {
                                    const nextStartDay = incomeDays[(index + 1) % incomeDays.length];
                                    const isLast = index === incomeDays.length - 1;
                                    const rangeLabel = isLast ? `Periodo: Día ${startDay} al ${nextStartDay > 1 ? nextStartDay - 1 : 30} (prox. mes)` : `Periodo: Día ${startDay} al ${nextStartDay - 1}`;

                                    const periodIncome = safeIncomes.filter(i => (i?.paymentDay || 1) === startDay).reduce((sum, i) => sum + (i?.amount || 0), 0);

                                    const expensesInPeriod = safeExpenses.filter(exp => {
                                        const day = exp?.paymentLimitDay || 1;
                                        if (startDay < nextStartDay) return day >= startDay && day < nextStartDay;
                                        else return day >= startDay || day < nextStartDay;
                                    });

                                    const periodExpenseTotal = expensesInPeriod.reduce((sum, e) => sum + (e?.amount || 0), 0);
                                    const balance = periodIncome - periodExpenseTotal;
                                    const expenseNames = expensesInPeriod.map(e => e?.name).join(', ');

                                    return (
                                        <div key={startDay} className="bg-white/50 rounded-lg p-2 border border-slate-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-slate-700">{rangeLabel}</span>
                                                <span className={`font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                    Dispo: {formatCurrency(balance, currency, currencySymbol)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                                                <div><span className="block text-emerald-600 font-medium">Ingresos (+{formatCurrency(periodIncome, currency, currencySymbol)})</span></div>
                                                <div className="relative group/tooltip">
                                                    <span className="block text-rose-500 font-medium cursor-help">Gastos (-{formatCurrency(periodExpenseTotal, currency, currencySymbol)})</span>
                                                    {expensesInPeriod.length > 0 && (
                                                        <>
                                                            <span className="block truncate opacity-75">{expenseNames}</span>
                                                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl z-50 min-w-[200px] border border-slate-700">
                                                                <p className="font-bold border-b border-slate-600 mb-1 pb-1">Desglose del periodo:</p>
                                                                <div className="max-h-[150px] overflow-y-auto">
                                                                    {expensesInPeriod.map(e => (
                                                                        <div key={e?.id} className="flex justify-between gap-4 py-0.5">
                                                                            <span>{e?.name}</span>
                                                                            <span className="font-mono text-rose-300">{formatCurrency(e?.amount || 0, currency, currencySymbol)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="absolute top-full left-4 w-2 h-2 bg-slate-800 rotate-45 -translate-y-1"></div>
                                                            </div>
                                                        </>
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

                {/* MAIN GRID LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-8">
                        {/* 1. INGRESOS FIJOS */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
                                    <h4 className="font-bold text-slate-700">Ingresos Fijos</h4>
                                </div>
                                <button onClick={() => { setEditingFixedIncome(null); setShowFixedIncomeForm(!showFixedIncomeForm); }} className="text-xs bg-white border border-slate-200 hover:bg-emerald-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
                                    + Agregar
                                </button>
                            </div>
                            {showFixedIncomeForm && (
                                <div className="p-4 bg-slate-50 border-b border-slate-100">
                                    <FixedIncomeForm defaultCategory="PERSONAL" initialData={editingFixedIncome} onSuccess={handleFixedIncomeSuccess} onCancel={() => setShowFixedIncomeForm(false)} onDelete={removeFixedIncome} />
                                </div>
                            )}
                            <div className="divide-y divide-slate-100">
                                {fixedIncomes.map(inc => (
                                    <div key={inc.id} className="p-4 flex justify-between items-center group hover:bg-slate-50">
                                        <div>
                                            <p className="font-medium text-slate-800">{inc.name}</p>
                                            <p className="text-xs text-slate-400">Día de cobro: {inc.paymentDay || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-emerald-600">{formatCurrency(inc.amount, currency, currencySymbol)}</span>
                                            <button onClick={() => { setEditingFixedIncome(inc); setShowFixedIncomeForm(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-all">✏️</button>
                                        </div>
                                    </div>
                                ))}
                                {fixedIncomes.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">No hay ingresos registrados.</p>}
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Total Ingresos</span>
                                <span className="font-bold text-emerald-700">{formatCurrency(totalFixedIncome, currency, currencySymbol)}</span>
                            </div>
                        </section>

                        {/* 2. DISPONIBILIDAD (CUENTAS PERSONALES) */}
                        <section id="personales" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                                    <h4 className="font-bold text-slate-700">Cuentas Personales</h4>
                                </div>
                                <button onClick={() => { setEditingAccount(null); setAccountFormSection('REGULAR'); setShowAccountForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
                                    + Nueva
                                </button>
                            </div>
                            {showAccountForm && accountFormSection === 'REGULAR' && (
                                <div className="p-6 bg-slate-50 border-b border-slate-100">
                                    <AccountForm defaultCategory="PERSONAL" initialData={editingAccount} defaultType="CASH" onSuccess={handleAccountSuccess} onCancel={() => { setShowAccountForm(false); setAccountFormSection(null); }} onDelete={removeAccount} />
                                </div>
                            )}
                            <div className="divide-y divide-slate-100">
                                {liquidFunds.map(acc => (
                                    <div key={acc.id} className="p-4 flex justify-between items-center hover:bg-slate-50 group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${acc.type === 'CASH' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{acc.type === 'CASH' ? '💵' : '🏦'}</div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{acc.name}</h4>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{acc.type === 'INVESTMENT' ? 'Inversión' : acc.type === 'CASH' ? 'Efectivo' : 'Banco'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-800">{formatCurrency(acc.balance, currency, currencySymbol)}</p>
                                            <button onClick={() => { setEditingAccount(acc); setAccountFormSection('REGULAR'); setShowAccountForm(true); }} className="text-[10px] text-blue-500 hover:underline mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                                        </div>
                                    </div>
                                ))}
                                {liquidFunds.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">No hay cuentas personales.</p>}
                            </div>
                        </section>

                        {/* 3. TARJETAS DE CRÉDITO */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-rose-500 rounded-full"></div>
                                    <h4 className="font-bold text-slate-700">Tarjetas de Crédito</h4>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setShowCardExpenseForm(!showCardExpenseForm); setShowAccountForm(false); setAccountFormSection(null); }} className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition-colors shadow-sm">
                                        💳 Consumo
                                    </button>
                                    <button onClick={() => { setEditingAccount(null); setAccountFormSection('CREDIT'); setShowAccountForm(true); setShowCardExpenseForm(false); }} className="text-xs text-slate-500 font-medium hover:underline flex items-center bg-white border border-slate-200 px-2 py-1.5 rounded-lg">
                                        + Nueva
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {showCardExpenseForm && (
                                    <div className="mb-6 animate-fade-in-down">
                                        <CardExpenseForm creditCards={creditCards} onSuccess={handleCardExpenseSuccess} onCancel={() => setShowCardExpenseForm(false)} />
                                    </div>
                                )}
                                {showAccountForm && accountFormSection === 'CREDIT' && (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-4 animate-fade-in-down">
                                        <AccountForm defaultCategory="PERSONAL" initialData={editingAccount} defaultType="CREDIT" onSuccess={handleAccountSuccess} onCancel={() => { setShowAccountForm(false); setAccountFormSection(null); }} onDelete={removeAccount} />
                                    </div>
                                )}
                                {creditCards.map(card => (
                                    <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-7 bg-slate-800 rounded flex items-center justify-center text-white text-[10px] font-mono">****</div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">{card.name}</h4>
                                                    <p className="text-[10px] text-slate-400">Tarjeta de Crédito</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deuda</p>
                                                <p className="text-lg font-extrabold text-rose-600">{formatCurrency(card.balance, currency, currencySymbol)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-3">
                                            <div><p className="text-[10px] text-slate-400 mb-0.5">Corte</p><p className="font-semibold text-slate-700 text-xs">Día {card.cutoffDay || '--'}</p></div>
                                            <div><p className="text-[10px] text-slate-400 mb-0.5">Límite Pago</p><p className="font-bold text-rose-600 text-xs">Día {card.paymentLimitDay || '--'}{card.cutoffDay && card.paymentLimitDay && card.paymentLimitDay < card.cutoffDay && <span className="text-[9px] ml-1 font-normal text-slate-500 block">(Mes Siguiente)</span>}</p></div>
                                            <div className="text-right"><p className="text-[10px] text-slate-400 mb-0.5">Límite Crédito</p><p className="font-medium text-slate-600 text-xs">{formatCurrency(card.limit || 0, currency, currencySymbol)}</p></div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-dashed border-slate-100 flex justify-end">
                                            <button onClick={() => { setEditingAccount(card); setAccountFormSection('CREDIT'); setShowAccountForm(true); setShowCardExpenseForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[10px] px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded transition-colors font-medium">Editar</button>
                                        </div>
                                    </div>
                                ))}
                                {creditCards.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No hay tarjetas de crédito registeredas.</p>}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-rose-500 rounded-full"></div>
                                    <h4 className="font-bold text-slate-700">Gastos Fijos Mensuales</h4>
                                </div>
                                <button onClick={() => { setEditingFixedExpense(null); setShowFixedExpenseForm(!showFixedExpenseForm); }} className="text-xs bg-white border border-slate-200 hover:bg-rose-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
                                    + Agregar
                                </button>
                            </div>
                            {showFixedExpenseForm && (
                                <div className="p-4 bg-slate-50 border-b border-slate-100">
                                    <FixedExpenseForm defaultCategory="PERSONAL" initialData={editingFixedExpense} onSuccess={handleFixedExpenseSuccess} onCancel={() => setShowFixedExpenseForm(false)} onDelete={removeFixedExpense} />
                                </div>
                            )}
                            <div className="divide-y divide-slate-100">
                                {fixedExpenses.map(exp => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    let targetDate: Date;
                                    if (exp.startDate) {
                                        const startDate = new Date(exp.startDate + 'T12:00:00');
                                        targetDate = new Date(startDate);
                                        while (targetDate < today) targetDate.setMonth(targetDate.getMonth() + 1);
                                    } else {
                                        const day = exp.paymentLimitDay || 1;
                                        targetDate = new Date(today.getFullYear(), today.getMonth(), day);
                                        if (targetDate < today) targetDate.setMonth(targetDate.getMonth() + 1);
                                    }
                                    const dateString = targetDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                                    const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                    const isUrgent = daysLeft <= 5 && daysLeft >= 0;
                                    return (
                                        <div key={exp.id} className="p-4 flex justify-between items-center group hover:bg-slate-50">
                                            <div>
                                                <p className="font-medium text-slate-800">{exp.name}</p>
                                                <div className="flex items-center gap-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isUrgent ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>📅 {dateString}</span>{isUrgent && <span className="text-[10px] text-orange-600 font-bold animate-pulse">¡Pronto!</span>}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-700">{formatCurrency(exp.amount, currency, currencySymbol)}</span>
                                                <button onClick={() => { setEditingFixedExpense(exp); setShowFixedExpenseForm(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-all">✏️</button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {fixedExpenses.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No hay gastos fijos registrados.</p>}
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Total Gastos Fijos</span>
                                <span className="font-bold text-slate-700">{formatCurrency(totalFixedExpense, currency, currencySymbol)}</span>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
