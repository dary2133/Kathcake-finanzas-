import { Transaction, Account, AppSettings, FixedExpense, TransactionType } from './types';

const TRANSACTIONS_KEY = 'kathcake_transactions';
const ACCOUNTS_KEY = 'kathcake_accounts';
const FIXED_EXPENSES_KEY = 'kathcake_fixed_expenses';

export const saveTransactions = (transactions: Transaction[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const getTransactions = (): Transaction[] => {
    if (typeof window === 'undefined') return [];

    // Final clear check
    if (localStorage.getItem('kathcake_wipe_final_v1') !== 'true') {
        localStorage.setItem(TRANSACTIONS_KEY, '[]');
        localStorage.setItem('kathcake_wipe_final_v1', 'true');
        return [];
    }

    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        return [];
    }
};

export const saveAccounts = (accounts: Account[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const getAccounts = (): Account[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    if (!stored) {
        // Seed default accounts if empty
        const defaults: Account[] = [
            { id: '1', name: 'Caja Chica', type: 'CASH', balance: 0 },
            { id: '2', name: 'Banco BHD', type: 'BANK', balance: 0 },
            { id: '3', name: 'Fondo Inversión BHD', type: 'INVESTMENT', balance: 0 },
            { id: '4', name: 'Tarjeta BHD', type: 'CREDIT', balance: 0, limit: 20000, cutoffDay: 28, paymentLimitDay: 15 },
        ];
        saveAccounts(defaults);
        return defaults;
    }
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Error parsing accounts', e);
        return [];
    }
};

export const updateAccount = (account: Account) => {
    const current = getAccounts();
    const updated = current.map(a => String(a.id) === String(account.id) ? account : a);
    saveAccounts(updated);
    return updated;
};

export const deleteAccount = (id: string | number) => {
    console.log('[STORAGE] Iniciando borrado de cuenta:', id);
    const current = getAccounts();
    const searchId = String(id).trim();
    const updated = current.filter(a => String(a.id).trim() !== searchId);

    if (updated.length === current.length) {
        console.warn('[STORAGE] No se encontró ninguna cuenta con ID:', searchId);
    } else {
        console.log('[STORAGE] Cuenta eliminada. Registros restantes:', updated.length);
    }

    saveAccounts(updated);
    return updated;
};

// Helper aliases for easier usage
export const addTransaction = (transaction: Transaction) => {
    const current = getTransactions();
    const updated = [transaction, ...current];
    saveTransactions(updated);
    return updated;
};

export const addTransactions = (newTransactions: Transaction[]) => {
    const current = getTransactions();
    const updated = [...newTransactions, ...current];
    saveTransactions(updated);
    return updated;
};

export const updateTransaction = (transaction: Transaction) => {
    const current = getTransactions();
    const updated = current.map(t => String(t.id) === String(transaction.id) ? transaction : t);
    saveTransactions(updated);
    return updated;
};

export const deleteTransaction = (id: string | number) => {
    console.log('[STORAGE] Iniciando borrado de transacción:', id);
    const current = getTransactions();
    const searchId = String(id).trim();
    const updated = current.filter(t => String(t.id).trim() !== searchId);

    if (updated.length === current.length) {
        console.warn('[STORAGE] No se encontró ninguna transacción con ID:', searchId);
    } else {
        console.log('[STORAGE] Transacción eliminada. Registros restantes:', updated.length);
    }

    saveTransactions(updated);
    return updated;
};

export const clearTransactions = (type?: TransactionType) => {
    if (!type) {
        saveTransactions([]);
        return [];
    }
    const current = getTransactions();
    const updated = current.filter(t => t.type !== type);
    saveTransactions(updated);
    return updated;
};

// Settings Logic
const SETTINGS_KEY = 'kathcake_settings';

export const saveSettings = (settings: AppSettings) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): AppSettings => {
    if (typeof window === 'undefined') return { currency: 'DOP', currencySymbol: 'RD$' };

    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
        // Return default settings if none exist
        return {
            currency: 'DOP',
            currencySymbol: 'RD$'
        };
    }

    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Error parsing settings', e);
        return { currency: 'DOP', currencySymbol: 'RD$' };
    }
};


// Fixed Expenses Logic
export const saveFixedExpenses = (expenses: FixedExpense[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(FIXED_EXPENSES_KEY, JSON.stringify(expenses));
};

export const getFixedExpenses = (): FixedExpense[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(FIXED_EXPENSES_KEY);
    if (!stored) {
        // Seed logic defaults
        const defaults: FixedExpense[] = [
            { id: '1', name: 'Alquiler Local', amount: 15500, paymentLimitDay: 5 },
            { id: '2', name: 'Internet/Teléfono', amount: 1565.62, paymentLimitDay: 5 },
            { id: '3', name: 'Energía Eléctrica', amount: 1700, paymentLimitDay: 5 },
        ];
        saveFixedExpenses(defaults);
        return defaults;
    }
    try {
        return JSON.parse(stored);
    } catch (e) { return []; }
};

export const updateFixedExpense = (expense: FixedExpense) => {
    const current = getFixedExpenses();
    const updated = current.map(e => String(e.id) === String(expense.id) ? expense : e);
    saveFixedExpenses(updated);
    return updated;
};

export const deleteFixedExpense = (id: string | number) => {
    console.log('--- OPERACION: ELIMINAR GASTO FIJO ---');
    const current = getFixedExpenses();
    const updated = current.filter(e => String(e.id).trim() !== String(id).trim());
    saveFixedExpenses(updated);
    return updated;
};

