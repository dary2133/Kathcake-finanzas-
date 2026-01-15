'use client';

import { useState } from 'react';
import Layout from '../components/Layout';
import AccountForm from '../components/AccountForm';
import FixedExpenseForm from '../components/FixedExpenseForm';
import FixedIncomeForm from '../components/FixedIncomeForm';
import CardExpenseForm from '../components/CardExpenseForm';
import { useAccounts, useSettings, useFixedExpenses, useFixedIncomes } from '../lib/hooks';
import { formatCurrency } from '../lib/utils';
import { Account, FixedExpense, FixedIncome } from '../lib/types';

export default function CuentasPage() {
    const { accounts, refreshAccounts, removeAccount } = useAccounts();
    const { fixedExpenses, refreshFixedExpenses, removeFixedExpense } = useFixedExpenses();
    const { fixedIncomes, refreshFixedIncomes, removeFixedIncome } = useFixedIncomes();
    const { settings } = useSettings();
    const { currencySymbol, currency } = settings;

    // State for Forms
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);
    const [editingFixedIncome, setEditingFixedIncome] = useState<FixedIncome | null>(null);

    const [showAccountForm, setShowAccountForm] = useState(false);
    const [showCardExpenseForm, setShowCardExpenseForm] = useState(false);
    const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
    const [showFixedIncomeForm, setShowFixedIncomeForm] = useState(false);

    // Handlers
    const handleAccountSuccess = () => { setShowAccountForm(false); setEditingAccount(null); refreshAccounts(); };
    const handleCardExpenseSuccess = () => { setShowCardExpenseForm(false); refreshAccounts(); };
    const handleFixedExpenseSuccess = () => { setShowFixedExpenseForm(false); setEditingFixedExpense(null); refreshFixedExpenses(); };
    const handleFixedIncomeSuccess = () => { setShowFixedIncomeForm(false); setEditingFixedIncome(null); refreshFixedIncomes(); };

    // Group Accounts & Totals
    const liquidFunds = accounts.filter(a => a.type === 'CASH' || a.type === 'BANK' || a.type === 'INVESTMENT');
    const creditCards = accounts.filter(a => a.type === 'CREDIT');
    const totalFunds = liquidFunds.reduce((sum, a) => sum + a.balance, 0);
    const totalDebt = creditCards.reduce((sum, a) => sum + a.balance, 0);
    const totalFixedIncome = fixedIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalFixedExpense = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netMonthlyFlow = totalFixedIncome - totalFixedExpense;

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
                    </div>
                </div>

                {/* SECTION 1: FLUJO FIJO MENSUAL */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-1 bg-purple-600 rounded-full"></div>
                        <h3 className="text-xl font-bold text-slate-800">Flujo Fijo Mensual</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* INGRESOS FIJOS */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h4 className="font-semibold text-slate-700">Ingresos Fijos Estipulados</h4>
                                <button onClick={() => { setEditingFixedIncome(null); setShowFixedIncomeForm(!showFixedIncomeForm); }} className="text-xs bg-white border border-slate-200 hover:bg-emerald-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
                                    + Agregar
                                </button>
                            </div>

                            {showFixedIncomeForm && (
                                <div className="p-4 bg-slate-50 border-b border-slate-100">
                                    <FixedIncomeForm initialData={editingFixedIncome} onSuccess={handleFixedIncomeSuccess} onCancel={() => setShowFixedIncomeForm(false)} onDelete={removeFixedIncome} />
                                </div>
                            )}

                            <div className="divide-y divide-slate-100 flex-grow">
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
                                {fixedIncomes.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No hay ingresos fijos registrados.</p>}
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Total Ingresos Fijos</span>
                                <span className="font-bold text-emerald-700">{formatCurrency(totalFixedIncome, currency, currencySymbol)}</span>
                            </div>
                        </div>

                        {/* GASTOS FIJOS */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h4 className="font-semibold text-slate-700">Gastos Fijos Mensuales</h4>
                                <button onClick={() => { setEditingFixedExpense(null); setShowFixedExpenseForm(!showFixedExpenseForm); }} className="text-xs bg-white border border-slate-200 hover:bg-rose-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
                                    + Agregar
                                </button>
                            </div>

                            {showFixedExpenseForm && (
                                <div className="p-4 bg-slate-50 border-b border-slate-100">
                                    <FixedExpenseForm initialData={editingFixedExpense} onSuccess={handleFixedExpenseSuccess} onCancel={() => setShowFixedExpenseForm(false)} onDelete={removeFixedExpense} />
                                </div>
                            )}

                            <div className="divide-y divide-slate-100 flex-grow">
                                {fixedExpenses.map(exp => (
                                    <div key={exp.id} className="p-4 flex justify-between items-center group hover:bg-slate-50">
                                        <div>
                                            <p className="font-medium text-slate-800">{exp.name}</p>
                                            <p className="text-xs text-slate-400">Límite pago: Día {exp.paymentLimitDay || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-700">{formatCurrency(exp.amount, currency, currencySymbol)}</span>
                                            <button onClick={() => { setEditingFixedExpense(exp); setShowFixedExpenseForm(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-all">✏️</button>
                                        </div>
                                    </div>
                                ))}
                                {fixedExpenses.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No hay gastos fijos registrados.</p>}
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Total Gastos Fijos</span>
                                <span className="font-bold text-slate-700">{formatCurrency(totalFixedExpense, currency, currencySymbol)}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2 & 3: ACTIVOS Y PASIVOS */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* ACTIVOS (BANCOS) */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-xl font-bold text-slate-800">Disponibilidad (Cuentas y Fondos)</h3>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-end">
                                <button onClick={() => { setEditingAccount(null); setShowAccountForm(!showAccountForm); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium">
                                    + Nueva Cuenta / Fondo
                                </button>
                            </div>

                            {/* Reuse Account Form just for generic accounts if needed here */}
                            {showAccountForm && !editingAccount?.type?.includes('CREDIT') && (
                                <div className="p-6 bg-slate-50 border-b border-slate-100">
                                    <AccountForm initialData={editingAccount} onSuccess={handleAccountSuccess} onCancel={() => setShowAccountForm(false)} onDelete={removeAccount} />
                                </div>
                            )}

                            <div className="divide-y divide-slate-100">
                                {liquidFunds.map(acc => (
                                    <div key={acc.id} className="p-6 flex justify-between items-center hover:bg-slate-50 group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${acc.type === 'CASH' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {acc.type === 'CASH' ? '💵' : '🏦'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{acc.name}</h4>
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                                                    {acc.type === 'INVESTMENT' ? 'Fondo Inversión' : acc.type === 'CASH' ? 'Efectivo' : 'Cuenta Banco'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-slate-800">{formatCurrency(acc.balance, currency, currencySymbol)}</p>
                                            <button onClick={() => { setEditingAccount(acc); setShowAccountForm(true); }} className="text-xs text-blue-500 hover:underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Editar / Eliminar</button>
                                        </div>
                                    </div>
                                ))}
                                {liquidFunds.length === 0 && <p className="p-8 text-center text-slate-400">No tienes cuentas registradas.</p>}
                            </div>
                        </div>
                    </section>

                    {/* PASIVOS (TARJETAS) */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-1 bg-rose-500 rounded-full"></div>
                            <h3 className="text-xl font-bold text-slate-800">Tarjetas de Crédito y Deudas</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-end gap-3">
                                <button onClick={() => { setShowCardExpenseForm(!showCardExpenseForm); setShowAccountForm(false); }} className="text-sm px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl transition-colors shadow-sm">
                                    💳 Registrar Consumo
                                </button>
                                <button onClick={() => { setEditingAccount(null); setShowAccountForm(true); setShowCardExpenseForm(false); }} className="text-sm text-slate-500 font-medium hover:underline flex items-center">
                                    + Nueva Tarjeta
                                </button>
                            </div>

                            {showCardExpenseForm && (
                                <div className="mb-6 animate-fade-in-down">
                                    <CardExpenseForm creditCards={creditCards} onSuccess={handleCardExpenseSuccess} onCancel={() => setShowCardExpenseForm(false)} />
                                </div>
                            )}

                            {showAccountForm && (editingAccount?.type === 'CREDIT' || (!editingAccount && showAccountForm)) && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-4 animate-fade-in-down">
                                    <AccountForm initialData={editingAccount} onSuccess={handleAccountSuccess} onCancel={() => setShowAccountForm(false)} onDelete={removeAccount} />
                                </div>
                            )}

                            {creditCards.map(card => (
                                <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-8 bg-slate-800 rounded md:w-16 md:h-10 flex items-center justify-center text-white text-xs font-mono">
                                                ****
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">{card.name}</h4>
                                                <p className="text-xs text-slate-400">Tarjeta de Crédito</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deuda Actual</p>
                                            <p className="text-2xl font-extrabold text-rose-600">{formatCurrency(card.balance, currency, currencySymbol)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Fecha Corte</p>
                                            <p className="font-semibold text-slate-700">Día {card.cutoffDay || '--'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Fecha Límite Pago</p>
                                            <p className="font-bold text-rose-600">Día {card.paymentLimitDay || '--'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 mb-1">Límite Crédito</p>
                                            <p className="font-medium text-slate-600">{formatCurrency(card.limit || 0, currency, currencySymbol)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-400 italic">
                                                Tus consumos se reflejan en Gastos.
                                            </p>
                                            <button onClick={() => { setEditingAccount(card); setShowAccountForm(true); setShowCardExpenseForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors font-medium">
                                                Editar Saldo / Fechas
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {creditCards.length === 0 && (
                                <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                                    No tienes tarjetas de crédito registradas.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
