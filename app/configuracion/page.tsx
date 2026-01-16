'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useSettings } from '../lib/hooks';
import { updateSettings } from '../lib/actions';
import { AppSettings } from '../lib/types';


export default function ConfiguracionPage() {
    const { settings, refreshSettings } = useSettings();
    const [currency, setCurrency] = useState(settings.currency);
    const [symbol, setSymbol] = useState(settings.currencySymbol);
    const [incomeDescriptions, setIncomeDescriptions] = useState<string[]>(settings.incomeDescriptions || []);
    const [expenseDescriptions, setExpenseDescriptions] = useState<string[]>(settings.expenseDescriptions || []);
    const [isEditingIncomes, setIsEditingIncomes] = useState(false);
    const [isEditingExpenses, setIsEditingExpenses] = useState(false);
    const [inputIncomeText, setInputIncomeText] = useState('');
    const [inputExpenseText, setInputExpenseText] = useState('');
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setCurrency(settings.currency);
        setSymbol(settings.currencySymbol);
        setIncomeDescriptions(settings.incomeDescriptions || []);
        setExpenseDescriptions(settings.expenseDescriptions || []);
        setInputIncomeText((settings.incomeDescriptions || []).join('\n'));
        setInputExpenseText((settings.expenseDescriptions || []).join('\n'));
    }, [settings]);

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCurrency = e.target.value;
        setCurrency(selectedCurrency);

        // Auto-set symbol based on common currencies
        switch (selectedCurrency) {
            case 'DOP': setSymbol('RD$'); break;
            case 'USD': setSymbol('$'); break;
            case 'EUR': setSymbol('€'); break;
            case 'BOB': setSymbol('Bs.'); break;
            case 'MXN': setSymbol('$'); break;
            case 'COP': setSymbol('$'); break;
            default: setSymbol('$');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanedIncomes = inputIncomeText.split('\n').map(line => line.trim()).filter(line => line !== '');
        const cleanedExpenses = inputExpenseText.split('\n').map(line => line.trim()).filter(line => line !== '');

        const newSettings: AppSettings = {
            currency,
            currencySymbol: symbol,
            incomeDescriptions: cleanedIncomes,
            expenseDescriptions: cleanedExpenses
        };

        await updateSettings(newSettings);
        await refreshSettings();

        setIsEditingIncomes(false);
        setIsEditingExpenses(false);

        // Show success message
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Configuración</h2>
                    <p className="text-slate-500">Personaliza la moneda y listas desplegables de tu aplicación.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* MONEDA SECTION */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <span>💰</span> Moneda Principal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Divisa</label>
                                <select
                                    value={currency}
                                    onChange={handleCurrencyChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                    <option value="DOP">Peso Dominicano (DOP)</option>
                                    <option value="USD">Dólar Estadounidense (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                    <option value="BOB">Boliviano (BOB)</option>
                                    <option value="MXN">Peso Mexicano (MXN)</option>
                                    <option value="COP">Peso Colombiano (COP)</option>
                                    <option value="ARS">Peso Argentino (ARS)</option>
                                    <option value="CLP">Peso Chileno (CLP)</option>
                                    <option value="PEN">Sol Peruano (PEN)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Símbolo</label>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ej: $"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* INCOME LIST SECTION */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 relative group">
                            <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                                <h3 className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
                                    <span>📈</span> Conceptos de Ingresos
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingIncomes(!isEditingIncomes)}
                                    className={`text-xs px-2 py-1 rounded-lg font-bold transition-colors ${isEditingIncomes ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'}`}
                                >
                                    {isEditingIncomes ? '✓ MODIFICANDO' : '✎ EDITAR'}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">Escribe cada opción en una línea diferente.</p>
                            <textarea
                                value={inputIncomeText}
                                onChange={(e) => setInputIncomeText(e.target.value)}
                                rows={12}
                                disabled={!isEditingIncomes}
                                className={`w-full px-4 py-2 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs leading-relaxed ${isEditingIncomes ? 'bg-white border-emerald-200 shadow-inner' : 'bg-slate-50 border-transparent text-slate-500 opacity-80 cursor-not-allowed'}`}
                                placeholder="Ej: VENTA DEL DIA"
                            />
                        </div>

                        {/* EXPENSE LIST SECTION */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 relative group">
                            <div className="flex justify-between items-center border-b border-rose-50 pb-2">
                                <h3 className="text-lg font-semibold text-rose-700 flex items-center gap-2">
                                    <span>📉</span> Conceptos de Gastos
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingExpenses(!isEditingExpenses)}
                                    className={`text-xs px-2 py-1 rounded-lg font-bold transition-colors ${isEditingExpenses ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600'}`}
                                >
                                    {isEditingExpenses ? '✓ MODIFICANDO' : '✎ EDITAR'}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">Escribe cada opción en una línea diferente.</p>
                            <textarea
                                value={inputExpenseText}
                                onChange={(e) => setInputExpenseText(e.target.value)}
                                rows={12}
                                disabled={!isEditingExpenses}
                                className={`w-full px-4 py-2 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-xs leading-relaxed ${isEditingExpenses ? 'bg-white border-rose-200 shadow-inner' : 'bg-slate-50 border-transparent text-slate-500 opacity-80 cursor-not-allowed'}`}
                                placeholder="Ej: HARINA"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-center">
                        <button
                            type="submit"
                            className="w-full md:w-auto bg-purple-600 text-white px-10 py-3 rounded-2xl hover:bg-purple-700 transition-all font-bold shadow-lg shadow-purple-200 active:scale-95 text-lg"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>



                {showToast && (
                    <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in-up">
                        ✅ Configuración guardada correctamente
                    </div>
                )}
            </div>
        </Layout>
    );
}
