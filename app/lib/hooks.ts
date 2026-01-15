
import { useState, useEffect } from 'react';
import { Transaction, Account, FixedExpense, FixedIncome, TransactionType, AppSettings } from './types';
import * as actions from './actions';

export function useTransactions(category?: 'PERSONAL' | 'KATHCAKE') {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTransactions = async () => {
        setLoading(true);
        const data = await actions.getTransactions();
        const filtered = category ? data.filter(t => t.transactionCategory === category) : data;
        setTransactions(filtered);
        setLoading(false);
    };

    const removeTransaction = async (id: string | number) => {
        await actions.deleteTransaction(String(id));
        await refreshTransactions();
    };

    const resetTransactions = async (type?: TransactionType) => {
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
    }, [category]);

    return { transactions, loading, refreshTransactions, removeTransaction, resetTransactions };
}

export function useAccounts(category?: 'PERSONAL' | 'KATHCAKE') {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshAccounts = async () => {
        setLoading(true);
        try {
            const data = await actions.getAccounts();
            // Filter by category if provided, otherwise return all
            const filtered = category && Array.isArray(data)
                ? data.filter(a => a && a.category === category)
                : (Array.isArray(data) ? data : []);
            setAccounts(filtered);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setAccounts([]);
        }
        setLoading(false);
    };

    const removeAccount = async (id: string | number) => {
        await actions.deleteAccount(String(id));
        await refreshAccounts();
    };

    useEffect(() => {
        refreshAccounts();
    }, [category]);

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

export function useFixedExpenses(category?: 'PERSONAL' | 'KATHCAKE') {
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshFixedExpenses = async () => {
        setLoading(true);
        try {
            const data = await actions.getFixedExpenses();
            const filtered = category && Array.isArray(data)
                ? data.filter(e => e && e.category === category)
                : (Array.isArray(data) ? data : []);
            setFixedExpenses(filtered);
        } catch (error) {
            console.error('Error fetching fixed expenses:', error);
            setFixedExpenses([]);
        }
        setLoading(false);
    };

    const removeFixedExpense = async (id: string | number) => {
        await actions.deleteFixedExpense(String(id));
        await refreshFixedExpenses();
    };

    useEffect(() => {
        refreshFixedExpenses();
    }, [category]);

    return { fixedExpenses, loading, refreshFixedExpenses, removeFixedExpense };
}

export function useFixedIncomes(category?: 'PERSONAL' | 'KATHCAKE') {
    const [fixedIncomes, setFixedIncomes] = useState<FixedIncome[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshFixedIncomes = async () => {
        setLoading(true);
        try {
            const data = await actions.getFixedIncomes();
            const filtered = category && Array.isArray(data)
                ? data.filter(i => i && i.category === category)
                : (Array.isArray(data) ? data : []);
            setFixedIncomes(filtered);
        } catch (error) {
            console.error('Error fetching fixed incomes:', error);
            setFixedIncomes([]);
        }
        setLoading(false);
    };

    const removeFixedIncome = async (id: string | number) => {
        await actions.deleteFixedIncome(String(id));
        await refreshFixedIncomes();
    };

    useEffect(() => {
        refreshFixedIncomes();
    }, [category]);

    return { fixedIncomes, loading, refreshFixedIncomes, removeFixedIncome };
}
