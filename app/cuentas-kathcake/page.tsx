'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AccountForm from '../components/AccountForm';
import FixedExpenseForm from '../components/FixedExpenseForm';
import FixedIncomeForm from '../components/FixedIncomeForm';
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
    const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
    const [showFixedIncomeForm, setShowFixedIncomeForm] = useState(false);

    const handleAccountSuccess = () => { setShowAccountForm(false); setEditingAccount(null); refreshAccounts(); };
    const handleFixedExpenseSuccess = () => { setShowFixedExpenseForm(false); setEditingFixedExpense(null); refreshFixedExpenses(); };
    const handleFixedIncomeSuccess = () => { setShowFixedIncomeForm(false); setEditingFixedIncome(null); refreshFixedIncomes(); };

    // Filtros y Cálculos Blindados
    const safeAccounts = Array.isArray(accounts) ? accounts.filter(Boolean) : [];
    const safeExpenses = Array.isArray(fixedExpenses) ? fixedExpenses.filter(Boolean) : [];
    const safeIncomes = Array.isArray(fixedIncomes) ? fixedIncomes.filter(Boolean) : [];

    const liquidFunds = safeAccounts.filter(a => a.type !== 'CREDIT');
    const totalFunds = liquidFunds.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm">
                        <h3 className="text-emerald-800 font-bold uppercase text-[10px] mb-1">Caja/Banco Negocio</h3>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalFunds, currency, currencySymbol)}</p>
                    </div>
                    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                        <h3 className="text-slate-500 font-bold uppercase text-[10px] mb-1">Total Ventas Fijas</h3>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(totalFixedIncome, currency, currencySymbol)}</p>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-sm border ${netMonthlyFlow >= 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                        <h3 className="font-bold uppercase text-[10px] mb-1">Margen Fijo Mensual</h3>
                        <p className="text-2xl font-black">{formatCurrency(netMonthlyFlow, currency, currencySymbol)}</p>
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
                                <button onClick={() => setShowAccountForm(true)} className="text-[10px] bg-pink-500 px-2 py-1 rounded font-bold">+ NUEVA CUENTA</button>
                            </div>
                            {showAccountForm && (
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
                    </div>
                </div>
            </div>
        </Layout>
    );
}
