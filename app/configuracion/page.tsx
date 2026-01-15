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
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setCurrency(settings.currency);
        setSymbol(settings.currencySymbol);
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

        const newSettings: AppSettings = {
            currency,
            currencySymbol: symbol
        };

        await updateSettings(newSettings);
        await refreshSettings();

        // Show success message
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Configuración</h2>
                    <p className="text-slate-500">Personaliza la moneda y otros ajustes de tu aplicación.</p>
                </div>

                <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">Moneda Principal</h3>

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

                        <p className="text-sm text-slate-400">
                            Este símbolo se mostrará en todos los montos del sistema (Dashboard, Ingresos, Gastos).
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-md shadow-purple-200"
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
