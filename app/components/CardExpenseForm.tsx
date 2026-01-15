'use client';

import { useState } from 'react';
import { Account, Transaction, TransactionType } from '@/app/lib/types';
import { registerCardExpense } from '@/app/lib/actions';

interface CardExpenseFormProps {
    creditCards: Account[];
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CardExpenseForm({ creditCards, onSuccess, onCancel }: CardExpenseFormProps) {
    const [selectedCardId, setSelectedCardId] = useState(creditCards.length > 0 ? creditCards[0].id : '');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCardId || !description || !amount) return;

        setIsSubmitting(true);
        try {
            const selectedCard = creditCards.find(c => c.id === selectedCardId);
            const cardName = selectedCard ? selectedCard.name : 'Credit Card';

            const newTransaction: Transaction = {
                id: crypto.randomUUID(),
                date,
                type: 'EXPENSE',
                category: 'Tarjeta de Crédito', // Fixed category for these inputs
                description: description,
                amount: parseFloat(amount),
                paymentMethod: cardName, // Saving card name here for reference
                status: 'PAID', // Assumed paid by card effectively
                location: 'Consumo Tarjeta'
            };

            await registerCardExpense(newTransaction, selectedCardId);
            onSuccess();

            // Reset
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error(error);
            alert('Error al registrar el consumo');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (creditCards.length === 0) {
        return (
            <div className="p-6 text-center">
                <p className="text-slate-500 mb-4">No tienes tarjetas registradas.</p>
                <button onClick={onCancel} className="text-blue-500 hover:underline">Cerrar</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100 space-y-4 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                💳 Registrar Consumo en Tarjeta
            </h3>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Tarjeta</label>
                <select
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                    {creditCards.map(card => (
                        <option key={card.id} value={card.id}>
                            {card.name} (Deuda: {card.balance.toFixed(2)})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Concepto / Nombre del Gasto</label>
                <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Supermercado, Cena, Gasolina"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monto Consumido</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 rounded-xl text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-medium bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'Guardando...' : 'Registrar Gasto'}
                </button>
            </div>
        </form>
    );
}
