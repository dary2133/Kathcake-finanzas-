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

export default function CuentasKathcakePage() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const { accounts = [], refreshAccounts } = useAccounts('KATHCAKE');
    const { fixedExpenses = [], refreshFixedExpenses } = useFixedExpenses('KATHCAKE');
    const { fixedIncomes = [], refreshFixedIncomes } = useFixedIncomes('KATHCAKE');
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

    // Filtros y Cálculos Blindados
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
                        <h2 className="text-3xl font-bold text-pink-600">Cuentas Kathcake</h2>
                        <p className="text-slate-500 text-sm">Finanzas exclusivas de la repostería</p>
                    </div>
                </div>

                {/* RESUMEN DE NEGOCIO */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
                        <h3 className="text-emerald-800 font-bold uppercase text-[9px] mb-1">Caja/Banco Negocio</h3>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(totalFunds, currency, currencySymbol)}</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-sm">
                        <h3 className="text-rose-800 font-bold uppercase text-[9px] mb-1">Deuda Negocio</h3>
                        <p className="text-xl font-black text-rose-600">{formatCurrency(totalDebt, currency, currencySymbol)}</p>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                        <h3 className="text-slate-500 font-bold uppercase text-[9px] mb-1">Ventas Fijas</h3>
                        <p className="text-xl font-black text-slate-800">{formatCurrency(totalFixedIncome, currency, currencySymbol)}</p>
                    </div>
                    {/* NUEVO MODELO DE FLUJO NETO FIJO (PREMIUM) */}
                    <div className="bg-[#f0f7ff] border border-blue-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                        {/* Decoración sutil */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                        <div className="relative z-10">
                            <h3 className="text-[#3b66cf] font-black uppercase tracking-widest text-xs mb-3">FLUJO NETO FIJO MENSUAL</h3>
                            <p className={`text-6xl font-black mb-10 drop-shadow-sm transition-transform group-hover:scale-[1.01] duration-300 ${netMonthlyFlow >= 0 ? 'text-[#2563eb]' : 'text-orange-600'}`}>
                                {netMonthlyFlow >= 0 ? '+' : ''}{formatCurrency(netMonthlyFlow, currency, currencySymbol)}
                            </p>

                            <div className="w-full border-t border-dashed border-blue-200/60 mb-10"></div>

                            <div className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-blue-50">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
                                    <span className="font-extrabold text-[#334155] text-lg font-sans">Cierre Mensual Estimado</span>
                                    <span className="font-black text-[#2563eb] text-lg flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Balance:</span>
                                        {formatCurrency(netMonthlyFlow, currency, currencySymbol)}
                                    </span>
                                </div>

                                <div className="space-y-5 mb-10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-semibold">Ventas Proyectadas (Ingresos)</span>
                                        <span className="text-[#10b981] font-black text-lg">+{formatCurrency(totalFixedIncome, currency, currencySymbol)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-semibold">Gastos Operativos Fijos</span>
                                        <span className="text-[#ef4444] font-black text-lg">-{formatCurrency(totalFixedExpense, currency, currencySymbol)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[11px] font-black text-[#94a3b8] italic uppercase tracking-widest">CICLO MENSUAL ÚNICO</span>
                                    <span className="bg-[#eff6ff] text-[#2563eb] text-[10px] font-black px-6 py-2.5 rounded-xl uppercase tracking-[0.2em] shadow-sm border border-blue-100">NEGOCIO</span>
                                </div>
                            </div>

                            {/* ANÁLISIS DINÁMICO DE PERIODOS (Integrado elegantemente) */}
                            <div className="mt-12">
                                <h4 className="font-black text-slate-800 text-[10px] mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
                                    PROYECCIÓN POR PERIODOS
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(function () {
                                        if (safeIncomes.length === 0) return <p className="text-slate-400 italic text-xs">Agrega ventas fijas para ver el desglose.</p>;

                                        const incomeDays = Array.from(new Set(safeIncomes.map(i => i.paymentDay || 1))).sort((a, b) => a - b);

                                        return incomeDays.map((startDay, index) => {
                                            const nextStartDay = incomeDays[(index + 1) % incomeDays.length];
                                            const isLast = index === incomeDays.length - 1;
                                            const rangeLabel = isLast ? `Día ${startDay} al ${nextStartDay > 1 ? nextStartDay - 1 : 30}` : `Día ${startDay} al ${nextStartDay - 1}`;

                                            const periodIncome = safeIncomes.filter(i => (i.paymentDay || 1) === startDay).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

                                            const expensesInPeriod = safeExpenses.filter(exp => {
                                                const day = exp.paymentLimitDay || 1;
                                                if (startDay < nextStartDay) return day >= startDay && day < nextStartDay;
                                                else return day >= startDay || day < nextStartDay;
                                            });

                                            const periodExpenseTotal = expensesInPeriod.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                                            const balance = periodIncome - periodExpenseTotal;

                                            return (
                                                <div key={startDay} className="bg-white/40 backdrop-blur-sm p-5 rounded-3xl border border-blue-100/50 hover:bg-white transition-all group/period shadow-sm">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="font-black text-slate-600 text-[10px] uppercase tracking-tighter">{rangeLabel}</span>
                                                        <span className={`font-black text-xs ${balance >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                            {formatCurrency(balance, currency, currencySymbol)}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-emerald-500 font-black text-[10px]">IN: +{formatCurrency(periodIncome, currency, currencySymbol)}</p>
                                                            <p className="text-rose-400 font-bold text-[10px]">OUT: -{formatCurrency(periodExpenseTotal, currency, currencySymbol)}</p>
                                                        </div>

                                                        <div className="relative group/tooltip">
                                                            <button className="text-[10px] bg-slate-100 text-slate-400 font-black px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors">DETALLE</button>
                                                            {expensesInPeriod.length > 0 && (
                                                                <div className="absolute right-0 bottom-full mb-3 hidden group-hover/tooltip:block bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl z-50 min-w-[240px] text-left border border-white/10">
                                                                    <p className="font-black border-b border-white/10 mb-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-blue-400">Gastos del ciclo:</p>
                                                                    <div className="max-h-[180px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                                        {expensesInPeriod.map(e => (
                                                                            <div key={e.id} className="flex justify-between gap-4 text-[11px]">
                                                                                <span className="text-slate-300 font-medium">{e.name}</span>
                                                                                <span className="font-mono text-rose-300 font-bold">{formatCurrency(e.amount, currency, currencySymbol)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="absolute top-full right-4 w-3 h-3 bg-slate-900/95 rotate-45 -translate-y-1.5 border-r border-b border-white/10"></div>
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
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        {/* SECCIÓN VENTAS FIJAS */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="p-4 border-b border-slate-100 bg-emerald-50 flex justify-between items-center">
                                <h4 className="font-bold text-emerald-800">Ventas Fijas (Ingresos)</h4>
                                <button onClick={() => setShowFixedIncomeForm(true)} className="text-xs bg-white px-3 py-1 rounded border border-emerald-200 text-emerald-600 font-bold">+ AGREGAR</button>
                            </div>
                            {showFixedIncomeForm && (
                                <div className="p-4 border-b"><FixedIncomeForm defaultCategory="KATHCAKE" initialData={editingFixedIncome} onSuccess={handleFixedIncomeSuccess} onCancel={() => setShowFixedIncomeForm(false)} /></div>
                            )}
                            <div className="divide-y divide-slate-50">
                                {safeIncomes.length === 0 ? <p className="p-8 text-center text-slate-400 text-sm">No hay ingresos registrados para Kathcake.</p> :
                                    safeIncomes.map(income => (
                                        <div key={income.id} className="p-4 flex justify-between items-center group">
                                            <p className="font-bold text-slate-800">{income.name}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-emerald-600">{formatCurrency(income.amount, currency, currencySymbol)}</span>
                                                <button onClick={() => { setEditingFixedIncome(income); setShowFixedIncomeForm(true); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-500 transition-all">✎</button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>

                        {/* SECCIÓN GASTOS OPERATIVOS */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="p-4 border-b border-slate-100 bg-rose-50 flex justify-between items-center">
                                <h4 className="font-bold text-rose-800">Gastos Operativos Fijos</h4>
                                <button onClick={() => setShowFixedExpenseForm(true)} className="text-xs bg-white px-3 py-1 rounded border border-rose-200 text-rose-600 font-bold">+ AGREGAR</button>
                            </div>
                            {showFixedExpenseForm && (
                                <div className="p-4 border-b"><FixedExpenseForm defaultCategory="KATHCAKE" initialData={editingFixedExpense} onSuccess={handleFixedExpenseSuccess} onCancel={() => setShowFixedExpenseForm(false)} /></div>
                            )}
                            <div className="divide-y divide-slate-50 text-sm">
                                {safeExpenses.length === 0 ? <p className="p-8 text-center text-slate-400">No hay gastos fijos de negocio.</p> :
                                    safeExpenses.map(expense => (
                                        <div key={expense.id} className="p-4 flex justify-between items-center group">
                                            <p className="font-medium text-slate-800">{expense.name}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-rose-500">-{formatCurrency(expense.amount, currency, currencySymbol)}</span>
                                                <button onClick={() => { setEditingFixedExpense(expense); setShowFixedExpenseForm(true); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-500 transition-all">✎</button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        {/* SECCIÓN CUENTAS DE BANCO KATHCAKE */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
                                <h4 className="font-bold">Bancos & Caja Kathcake</h4>
                                <button onClick={() => { setAccountFormSection('REGULAR'); setShowAccountForm(true); }} className="text-[10px] bg-pink-500 px-2 py-1 rounded font-bold">+ NUEVA CUENTA</button>
                            </div>
                            {showAccountForm && accountFormSection === 'REGULAR' && (
                                <div className="p-4 border-b"><AccountForm defaultType="BANK" defaultCategory="KATHCAKE" initialData={editingAccount} onSuccess={handleAccountSuccess} onCancel={() => setShowAccountForm(false)} /></div>
                            )}
                            <div className="p-4 grid grid-cols-1 gap-3">
                                {liquidFunds.length === 0 ? <p className="text-center py-6 text-slate-400 text-sm italic">Sin cuentas registradas para el negocio.</p> :
                                    liquidFunds.map(account => (
                                        <div key={account.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-pink-200 transition-all shadow-sm">
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-black tracking-widest">{account.type}</p>
                                                <p className="font-bold text-slate-800 text-lg">{account.name}</p>
                                            </div>
                                            <span className="text-xl font-black text-slate-900">{formatCurrency(account.balance, currency, currencySymbol)}</span>
                                        </div>
                                    ))}
                            </div>
                        </section>

                        {/* SECCIÓN TARJETAS KATHCAKE */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h4 className="font-bold text-slate-700">Deudas (Tarjetas Negocio)</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCardExpenseForm(true)} className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded font-bold">💳 CONSUMO</button>
                                    <button onClick={() => { setAccountFormSection('CREDIT'); setShowAccountForm(true); }} className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">+ TARJETA</button>
                                </div>
                            </div>
                            {showCardExpenseForm && (
                                <div className="p-4 border-b"><CardExpenseForm creditCards={creditCards} onSuccess={handleCardExpenseSuccess} onCancel={() => setShowCardExpenseForm(false)} /></div>
                            )}
                            {showAccountForm && accountFormSection === 'CREDIT' && (
                                <div className="p-4 border-b"><AccountForm defaultType="CREDIT" defaultCategory="KATHCAKE" initialData={editingAccount} onSuccess={handleAccountSuccess} onCancel={() => setShowAccountForm(false)} /></div>
                            )}
                            <div className="p-4 space-y-4">
                                {creditCards.length === 0 ? <p className="text-center py-6 text-slate-400 text-sm italic">Sin tarjetas registradas para el negocio.</p> :
                                    creditCards.map(card => (
                                        <div key={card.id} className="relative p-4 rounded-2xl bg-gradient-to-br from-pink-900 to-slate-900 text-white shadow-lg overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <span className="text-6xl italic font-black">KC</span>
                                            </div>
                                            <div className="relative z-10 flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] uppercase opacity-60 font-medium tracking-widest">{card.name}</p>
                                                    <p className="text-xl font-black mt-1 decoration-pink-500/30 decoration-2 underline-offset-4">{formatCurrency(card.balance, currency, currencySymbol)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] uppercase opacity-60 font-medium tracking-widest">Límite</p>
                                                    <p className="text-sm font-bold">{formatCurrency(card.limit || 0, currency, currencySymbol)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400" style={{ width: `${Math.min(100, (((card.limit || 0) - card.balance) / (card.limit || 1)) * 100)}%` }}></div>
                                            </div>
                                            <div className="mt-2 flex justify-between items-center opacity-70">
                                                <p className="text-[9px] uppercase tracking-tighter">Disponible: {formatCurrency((card.limit || 0) - card.balance, currency, currencySymbol)}</p>
                                                <button onClick={() => { setEditingAccount(card); setAccountFormSection('CREDIT'); setShowAccountForm(true); }} className="text-[9px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors">EDITAR</button>
                                            </div>
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
