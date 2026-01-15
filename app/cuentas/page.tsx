'use client';

import { useState } from 'react';
import Layout from '../components/Layout';
import AccountForm from '../components/AccountForm';
import FixedExpenseForm from '../components/FixedExpenseForm';
import { useAccounts, useSettings, useFixedExpenses } from '../lib/hooks';
import { formatCurrency } from '../lib/utils';
import { Account, FixedExpense } from '../lib/types';

export default function CuentasPage() {
    const { accounts, refreshAccounts, removeAccount } = useAccounts();
    const { fixedExpenses, refreshFixedExpenses, removeFixedExpense } = useFixedExpenses();
    const { settings } = useSettings();
    const { currencySymbol, currency } = settings;

    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [editingFixed, setEditingFixed] = useState<FixedExpense | null>(null);
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [showFixedForm, setShowFixedForm] = useState(false);

    // Group Accounts
    const liquidFunds = accounts.filter(a => a.type === 'CASH' || a.type === 'BANK' || a.type === 'INVESTMENT');
    const creditCards = accounts.filter(a => a.type === 'CREDIT');

    const totalFunds = liquidFunds.reduce((sum, a) => sum + a.balance, 0);
    const totalDebt = creditCards.reduce((sum, a) => sum + a.balance, 0);

    const handleAccountSuccess = () => {
        setShowAccountForm(false);
        setEditingAccount(null);
        refreshAccounts();
    };

    const handleFixedSuccess = () => {
        setShowFixedForm(false);
        setEditingFixed(null);
        refreshFixedExpenses();
    };

    const startEditAccount = (acc: Account) => {
        setEditingAccount(acc);
        setShowAccountForm(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const startEditFixed = (exp: FixedExpense) => {
        setEditingFixed(exp);
        setShowFixedForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Cuentas y Deudas</h2>
                        <p className="text-slate-500">Gestiona tus fondos, tarjetas y gastos fijos.</p>
                    </div>
                    <div className="gap-2 flex">
                        <button
                            onClick={() => {
                                setEditingAccount(null);
                                setShowAccountForm(!showAccountForm);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            {showAccountForm && !editingAccount ? 'Cancelar' : '+ Nueva Cuenta'}
                        </button>
                        <button
                            onClick={() => {
                                setEditingFixed(null);
                                setShowFixedForm(!showFixedForm);
                            }}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            {showFixedForm && !editingFixed ? 'Cancelar' : '+ Gasto Fijo'}
                        </button>
                    </div>
                </div>

                {/* Forms */}
                {showAccountForm && (
                    <div className="animate-fade-in-down mb-6">
                        <AccountForm
                            initialData={editingAccount}
                            onSuccess={handleAccountSuccess}
                            onCancel={() => { setShowAccountForm(false); setEditingAccount(null); }}
                            onDelete={removeAccount}
                        />
                    </div>
                )}
                {showFixedForm && (
                    <div className="animate-fade-in-down mb-6">
                        <FixedExpenseForm
                            initialData={editingFixed}
                            onSuccess={handleFixedSuccess}
                            onCancel={() => { setShowFixedForm(false); setEditingFixed(null); }}
                            onDelete={removeFixedExpense}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* COLUMN 1: FUNDS (Activos) */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                            <h3 className="text-emerald-800 font-bold uppercase text-sm mb-2">Dinero Disponible Total</h3>
                            <p className="text-4xl font-extrabold text-emerald-600">{formatCurrency(totalFunds, currency, currencySymbol)}</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-700">Fondos e Inversiones</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {liquidFunds.map(acc => (
                                    <div key={acc.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 group relative">
                                        <div>
                                            <p className="font-medium text-slate-800">{acc.name}</p>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                                {acc.type === 'CASH' ? 'Efectivo' : acc.type === 'INVESTMENT' ? 'Inversión' : 'Banco'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-slate-700">{formatCurrency(acc.balance, currency, currencySymbol)}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => startEditAccount(acc)} className="p-1 hover:bg-blue-50 rounded text-blue-500 transition-colors">✏️</button>
                                                <button onClick={async () => {
                                                    if (window.confirm('¿Eliminar esta cuenta?')) {
                                                        await removeAccount(acc.id);
                                                        window.location.reload();
                                                    }
                                                }} className="p-1 hover:bg-rose-50 rounded text-rose-500 transition-colors" title="Eliminar Cuenta">🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {liquidFunds.length === 0 && <p className="px-6 py-4 text-slate-400 text-sm text-center">No hay cuentas registradas</p>}
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 2: DEBTS (Pasivos) */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl">
                            <h3 className="text-rose-800 font-bold uppercase text-sm mb-2">Deuda Total Tarjetas</h3>
                            <p className="text-4xl font-extrabold text-rose-600">{formatCurrency(totalDebt, currency, currencySymbol)}</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-700">Tarjetas de Crédito</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {creditCards.map(acc => (
                                    <div key={acc.id} className="px-6 py-4 space-y-2 hover:bg-slate-50 group relative">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium text-slate-800">{acc.name}</p>
                                            <div className="flex items-center gap-4">
                                                <p className="font-bold text-rose-600">{formatCurrency(acc.balance, currency, currencySymbol)}</p>
                                                <div className="flex gap-2 text-sm">
                                                    <button onClick={() => startEditAccount(acc)} className="p-1 hover:bg-blue-50 rounded text-blue-500 transition-colors">✏️</button>
                                                    <button onClick={async () => {
                                                        if (window.confirm('¿Eliminar tarjeta?')) {
                                                            await removeAccount(acc.id);
                                                            window.location.reload();
                                                        }
                                                    }} className="p-1 hover:bg-rose-50 rounded text-rose-500 transition-colors" title="Eliminar Tarjeta">🗑️</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-xs text-slate-500">
                                            {acc.limit && <p>Límite: <span className="text-slate-700">{formatCurrency(acc.limit, currency, currencySymbol)}</span></p>}
                                            {acc.cutoffDay && <p>Corte: Día <span className="font-bold text-slate-700">{acc.cutoffDay}</span></p>}
                                            {acc.paymentLimitDay && <p>Pagar antes del: <span className="font-bold text-rose-600">{acc.paymentLimitDay}</span></p>}
                                        </div>
                                    </div>
                                ))}
                                {creditCards.length === 0 && <p className="px-6 py-4 text-slate-400 text-sm text-center">No hay tarjetas registradas</p>}
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 3: FIXED EXPENSES (Compromisos) */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-slate-800 p-6 rounded-2xl text-white">
                            <h3 className="text-slate-300 font-bold uppercase text-sm mb-2">Gastos Fijos Mensuales</h3>
                            <p className="text-4xl font-extrabold text-white">
                                {formatCurrency(fixedExpenses.reduce((sum, e) => sum + e.amount, 0), currency, currencySymbol)}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3">Concepto</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3 text-center">Día Límite</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fixedExpenses.map(exp => (
                                        <tr key={exp.id} className="hover:bg-slate-50 group">
                                            <td className="px-4 py-3 text-slate-800 font-medium">{exp.name}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(exp.amount, currency, currencySymbol)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {exp.paymentLimitDay ? (
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                                        Día {exp.paymentLimitDay}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-1 py-1 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => startEditFixed(exp)} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">✏️</button>
                                                    <button onClick={async () => {
                                                        if (window.confirm('¿Eliminar este gasto fijo?')) {
                                                            await removeFixedExpense(exp.id);
                                                            window.location.reload();
                                                        }
                                                    }} className="text-rose-500 hover:text-rose-700 p-1" title="Eliminar">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {fixedExpenses.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-4 text-slate-400 text-center">Sin gastos fijos</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
