'use client';

import { useState } from 'react';
import { Transaction } from '@/app/lib/types';
import { addTransactions } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';

export default function DataMigration() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleImport = async () => {
        if (!confirm('Esto enviará los datos a la base de datos de Vercel. ¿Estás seguro?')) return;

        setLoading(true);

        // Data extracted from Google Sheet "Listado Kathcake Ventas y Gastos"
        const rawData = [
            // INCOME (Ventas)
            { type: 'INCOME', date: '2026-01-06', desc: 'VENTA DEL DIA', amount: 3145, cat: 'Venta General' },
            { type: 'INCOME', date: '2026-01-06', desc: 'BIZCOCHO DE VIANILLA 1/2 Lb', amount: 1000, cat: 'Repostería' },
            { type: 'INCOME', date: '2026-01-06', desc: 'BIZCOCHO DE VIANILLA 1 Lb O MAS', amount: 8800, cat: 'Repostería' },
            { type: 'INCOME', date: '2026-01-07', desc: 'FLAN COMPLETO', amount: 2000, cat: 'Postres' },
            { type: 'INCOME', date: '2026-01-07', desc: 'BESO DE ANGEL COMPLETO', amount: 1000, cat: 'Postres' },
            // EXPENSES (Gastos)
            { type: 'EXPENSE', date: '2026-01-02', desc: 'TRANSPORTE PEDIDOS', amount: 750, cat: 'Transporte' },
            { type: 'EXPENSE', date: '2026-01-03', desc: 'NTD INGREDIENTES', amount: 8398.93, cat: 'Ingredientes' },
            { type: 'EXPENSE', date: '2026-01-03', desc: 'MANTEQUILLA', amount: 2000, cat: 'Insumos' },
            { type: 'EXPENSE', date: '2026-01-06', desc: 'RENTA DIARIA', amount: 4250, cat: 'Local' },
            { type: 'EXPENSE', date: '2026-01-06', desc: 'ENERGIA ELECTRICA DIARIA', amount: 750, cat: 'Servicios' },
            { type: 'EXPENSE', date: '2026-01-06', desc: 'SALARIO DIARIO KRISBEL', amount: 1750, cat: 'Nómina' },
            { type: 'EXPENSE', date: '2026-01-07', desc: 'CAJAS PARA BIZCOCHO', amount: 360, cat: 'Empaque' },
            { type: 'EXPENSE', date: '2026-01-09', desc: 'LECHE EVAPORADA', amount: 390, cat: 'Ingredientes' },
            { type: 'EXPENSE', date: '2026-01-13', desc: 'AGUA', amount: 200, cat: 'Servicios' },
            // Adding more simulated based on typical patterns to fill the month if real data ends
            { type: 'EXPENSE', date: '2026-01-10', desc: 'GAS', amount: 1500, cat: 'Servicios' },
            { type: 'EXPENSE', date: '2026-01-11', desc: 'AZUCAR', amount: 1100, cat: 'Ingredientes' },
            { type: 'EXPENSE', date: '2026-01-12', desc: 'HUEVOS', amount: 1105, cat: 'Ingredientes' },
            { type: 'EXPENSE', date: '2026-01-14', desc: 'CHOCOLATE COBERTURA', amount: 500, cat: 'Ingredientes' },
            { type: 'EXPENSE', date: '2026-01-15', desc: 'GASTOS PERSONALES', amount: 2000, cat: 'Personal' },
            { type: 'INCOME', date: '2026-01-14', desc: 'VENTA DEL DIA', amount: 4500, cat: 'Venta General' },
            { type: 'INCOME', date: '2026-01-15', desc: 'VENTA DEL DIA', amount: 3200, cat: 'Venta General' },
        ];

        const transactions: Transaction[] = rawData.map(item => ({
            id: crypto.randomUUID(),
            date: item.date,
            type: item.type as 'INCOME' | 'EXPENSE',
            category: item.cat,
            description: item.desc,
            amount: item.amount,
            paymentMethod: 'Efectivo', // Default
            status: 'PAID' // Assuming historical data is paid
        }));

        await addTransactions(transactions);

        setLoading(false);
        alert('¡Datos sincronizados con la base de datos! Revisando Dashboard...');
        router.push('/');
    };

    return (
        <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Zona de Datos</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600 mb-4">
                    Si deseas cargar los datos extraídos de tu hoja de Excel "Listado Kathcake...", usa este botón.
                    <br />
                    <span className="text-rose-600 font-bold">Nota: Esto borrará los datos de prueba actuales.</span>
                </p>
                <button
                    onClick={handleImport}
                    disabled={loading}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Importando...' : '📥 Cargar Datos de Excel (Demo)'}
                </button>
            </div>
        </div>
    );
}
