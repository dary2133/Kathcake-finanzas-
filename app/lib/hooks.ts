
import { useState, useEffect } from 'react';
import { Transaction, Account, FixedExpense, TransactionType, AppSettings } from './types';
import * as actions from './actions';

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTransactions = async () => {
        setLoading(true);
        const data = await actions.getTransactions();
        setTransactions(data);
        setLoading(false);
    };

    const removeTransaction = async (id: string | number) => {
        await actions.deleteTransaction(String(id));
        await refreshTransactions();
    };

    const resetTransactions = async (type?: TransactionType) => {
        // Since Postgres doesn't have a 'clear all' in actions yet, 
        // we'd need to implement it. For now, let's just delete one by one or add a clear action.
        // Actually, the user wanted start fresh.
        if (window.confirm('¿Confirmar borrado total de esta categoría?')) {
            const list = transactions.filter(t => !type || t.type === type);
            for (const t of list) {
                await actions.deleteTransaction(t.id);
            }
            await refreshTransactions();
        }
    };

    useEffect(() => {
        refreshTransactions();
    }, []);

    return { transactions, loading, refreshTransactions, removeTransaction, resetTransactions };
}

export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshAccounts = async () => {
        setLoading(true);
        const data = await actions.getAccounts();
        setAccounts(data);
        setLoading(false);
    };

    const removeAccount = async (id: string | number) => {
        await actions.deleteAccount(String(id));
        await refreshAccounts();
    };

    useEffect(() => {
        refreshAccounts();
    }, []);

    return { accounts, loading, refreshAccounts, removeAccount };
}

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>({ currency: 'DOP', currencySymbol: 'RD$' });
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        setLoading(true);
        const data = await actions.getSettings();
        setSettings(data);
        setLoading(false);
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return { settings, loading, refreshSettings };
}

export function useFixedExpenses() {
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshFixedExpenses = async () => {
        setLoading(true);
        const data = await actions.getFixedExpenses();
        setFixedExpenses(data);
        setLoading(false);
    };

    const removeFixedExpense = async (id: string | number) => {
        await actions.deleteFixedExpense(String(id));
        await refreshFixedExpenses();
    };

    useEffect(() => {
        refreshFixedExpenses();
    }, []);

    return { fixedExpenses, loading, refreshFixedExpenses, removeFixedExpense };
}
