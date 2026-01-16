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
                    {/* CAJA/BANCO NEGOCIO CARD */}
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-full bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="text-6xl font-black text-emerald-900">$</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-emerald-800 font-bold uppercase text-[9px] mb-1 tracking-widest">Caja/Banco Negocio</h3>
                            <p className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(totalFunds, currency, currencySymbol)}</p>
                        </div>

                        {/* Breakdown of Business Funds */}
                        <div className="mt-4 pt-3 border-t border-emerald-100/50 space-y-2">
                            <p className="text-[9px] uppercase font-bold text-emerald-800/40 tracking-wider">Cuentas Disponibles</p>
                            <div className="space-y-1.5">
                                {liquidFunds.length === 0 ? <p className="text-[9px] text-slate-400 italic">Sin fondos registrados</p> :
                                    liquidFunds.map(acc => (
                                        <div key={acc.id} className="flex justify-between items-center text-[10px]">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                <span className="text-slate-600 font-medium truncate max-w-[80px]">{acc.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-700">{formatCurrency(acc.balance, currency, currencySymbol)}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* DEUDA NEGOCIO CARD */}
                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl shadow-sm flex flex-col h-full bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="text-6xl font-black text-rose-900">%</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-rose-800 font-bold uppercase text-[9px] mb-1 tracking-widest">Deuda Negocio</h3>
                            <p className="text-2xl font-black text-rose-600 tracking-tight">{formatCurrency(totalDebt, currency, currencySymbol)}</p>
                        </div>

                        {/* Breakdown of Business Debt */}
                        <div className="mt-4 pt-3 border-t border-rose-100/50 space-y-2">
                            <p className="text-[9px] uppercase font-bold text-rose-800/40 tracking-wider">Tarjetas Corporativas</p>
                            <div className="space-y-1.5">
                                {creditCards.length === 0 ? <p className="text-[9px] text-slate-400 italic">Sin deuda registrada</p> :
                                    creditCards.map(card => (
                                        <div key={card.id} className="flex justify-between items-center text-[10px] group/card">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 group-hover/card:animate-pulse"></div>
                                                <span className="text-slate-600 font-medium truncate max-w-[80px]">{card.name}</span>
                                            </div>
                                            <span className="font-bold text-rose-600">{formatCurrency(card.balance, currency, currencySymbol)}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* VENTAS FIJAS CARD */}
                    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="text-6xl font-black text-slate-900">#</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 font-bold uppercase text-[9px] mb-1 tracking-widest">Ventas Fijas</h3>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totalFixedIncome, currency, currencySymbol)}</p>
                        </div>

                        {/* Breakdown of Fixed Sales */}
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Principales Fuentes</p>
                            <div className="space-y-1.5">
                                {safeIncomes.length === 0 ? <p className="text-[9px] text-slate-400 italic">Sin ventas fijas</p> :
                                    safeIncomes.slice(0, 3).map(inc => (
                                        <div key={inc.id} className="flex justify-between items-center text-[10px]">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                <span className="text-slate-600 font-medium truncate max-w-[80px]">{inc.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-700">{formatCurrency(inc.amount, currency, currencySymbol)}</span>
                                        </div>
                                    ))
                                }
                                {safeIncomes.length > 3 && <p className="text-[9px] text-slate-400 text-right italic pt-1">...y {safeIncomes.length - 3} más</p>}
                            </div>
                        </div>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-sm border ${netMonthlyFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                        <h3 className={`font-bold uppercase text-[10px] mb-1 ${netMonthlyFlow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Margen Fijo Mensual</h3>
                        <p className={`text-2xl font-black ${netMonthlyFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(netMonthlyFlow, currency, currencySymbol)}</p>

                        {/* ANÁLISIS DE CICLO MENSUAL ÚNICO */}
                        <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-xs space-y-3">
                            {(function () {
                                if (safeIncomes.length === 0) return <p className="text-slate-400 italic">Agrega ventas fijas para ver el desglose.</p>;

                                // Para Kathcake el ciclo es mensual único empezando desde el primer día de pago
                                const startDay = Math.min(...safeIncomes.map(i => i.paymentDay || 1));
                                const endDay = startDay === 1 ? 30 : startDay - 1;
                                const rangeLabel = `PERIODO: DÍA ${startDay} AL ${endDay}`;

                                return (
                                    <div className="bg-white/60 p-4 rounded-xl border border-slate-100 shadow-sm relative group/period">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight">{rangeLabel}</span>
                                                <p className="text-[9px] text-slate-400 font-bold">(MES APROXIMADO)</p>
                                            </div>
                                            <span className={`font-black text-[11px] ${netMonthlyFlow >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                Balance: {formatCurrency(netMonthlyFlow, currency, currencySymbol)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                                            <div className="space-y-0.5">
                                                <p className="text-emerald-600 font-bold text-[10px]">Ventas (+{formatCurrency(totalFixedIncome, currency, currencySymbol)})</p>
                                            </div>
                                            <div className="relative group/tooltip text-right">
                                                <p className="text-rose-500 font-bold text-[10px] cursor-help">Gastos (-{formatCurrency(totalFixedExpense, currency, currencySymbol)})</p>
                                                <p className="text-[9px] text-slate-400 truncate mt-0.5">{safeExpenses.map(e => e.name).join(', ') || 'Sin gastos'}</p>

                                                {safeExpenses.length > 0 && (
                                                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-slate-900 text-white p-3 rounded-xl shadow-2xl z-50 min-w-[220px] text-left border border-slate-700 backdrop-blur-md">
                                                        <p className="font-bold border-b border-white/10 mb-2 pb-1 text-[10px] uppercase tracking-widest text-slate-400">Gastos del periodo:</p>
                                                        <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                                                            {safeExpenses.map(e => (
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
                            })()}
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
