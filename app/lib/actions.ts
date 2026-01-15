
'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { Transaction, Account, FixedExpense, FixedIncome, AppSettings, TransactionType } from './types';

// ACCOUNTS
export async function getAccounts(): Promise<Account[]> {
    try {
        const { rows } = await sql<any>`SELECT * FROM accounts ORDER BY name ASC`;
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type,
            balance: parseFloat(row.balance),
            limit: row.limit ? parseFloat(row.limit) : undefined,
            cutoffDay: row.cutoff_day,
            paymentLimitDay: row.payment_limit_day
        }));
    } catch (error) {
        console.error('Failed to fetch accounts:', error);
        return [];
    }
}

export async function addAccount(account: Account) {
    try {
        await sql`
            INSERT INTO accounts (id, name, type, balance, "limit", cutoff_day, payment_limit_day)
            VALUES (${account.id}, ${account.name}, ${account.type}, ${account.balance}, ${account.limit || null}, ${account.cutoffDay || null}, ${account.paymentLimitDay || null})
        `;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to add account:', error);
    }
}

export async function updateAccount(account: Account) {
    try {
        await sql`
            UPDATE accounts 
            SET name = ${account.name}, 
                type = ${account.type}, 
                balance = ${account.balance}, 
                "limit" = ${account.limit || null}, 
                cutoff_day = ${account.cutoffDay || null}, 
                payment_limit_day = ${account.paymentLimitDay || null}
            WHERE id = ${account.id}
        `;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to update account:', error);
    }
}

export async function deleteAccount(id: string) {
    try {
        await sql`DELETE FROM accounts WHERE id = ${id}`;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to delete account:', error);
    }
}

// TRANSACTIONS
export async function getTransactions(): Promise<Transaction[]> {
    try {
        const { rows } = await sql<any>`SELECT * FROM transactions ORDER BY date DESC, id DESC`;
        return rows.map(row => ({
            id: row.id,
            date: row.date.toISOString().split('T')[0],
            type: row.type as TransactionType,
            category: row.category,
            description: row.description,
            amount: parseFloat(row.amount),
            paymentMethod: row.payment_method,
            status: row.status as 'PAID' | 'PENDING',
            location: row.location,
            dueDate: row.due_date ? row.due_date.toISOString().split('T')[0] : undefined
        }));
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
    }
}

export async function addTransaction(t: Transaction) {
    try {
        await sql`
            INSERT INTO transactions (id, date, type, category, description, amount, payment_method, status, location, due_date)
            VALUES (${t.id}, ${t.date}, ${t.type}, ${t.category}, ${t.description}, ${t.amount}, ${t.paymentMethod}, ${t.status}, ${t.location || null}, ${t.dueDate || null})
        `;
        revalidatePath('/ingresos');
        revalidatePath('/gastos');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to add transaction:', error);
    }
}

export async function addTransactions(list: Transaction[]) {
    try {
        for (const t of list) {
            await sql`
                INSERT INTO transactions (id, date, type, category, description, amount, payment_method, status, location, due_date)
                VALUES (${t.id}, ${t.date}, ${t.type}, ${t.category}, ${t.description}, ${t.amount}, ${t.paymentMethod}, ${t.status}, ${t.location || null}, ${t.dueDate || null})
                ON CONFLICT (id) DO NOTHING
            `;
        }
        revalidatePath('/ingresos');
        revalidatePath('/gastos');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to bulk add transactions:', error);
    }
}

export async function updateTransaction(t: Transaction) {
    try {
        await sql`
            UPDATE transactions 
            SET date = ${t.date}, 
                type = ${t.type}, 
                category = ${t.category}, 
                description = ${t.description}, 
                amount = ${t.amount}, 
                payment_method = ${t.paymentMethod}, 
                status = ${t.status}, 
                location = ${t.location || null}, 
                due_date = ${t.dueDate || null}
            WHERE id = ${t.id}
        `;
        revalidatePath('/ingresos');
        revalidatePath('/gastos');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to update transaction:', error);
    }
}

export async function deleteTransaction(id: string) {
    try {
        await sql`DELETE FROM transactions WHERE id = ${id}`;
        revalidatePath('/ingresos');
        revalidatePath('/gastos');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to delete transaction:', error);
    }
}

// FIXED EXPENSES
export async function getFixedExpenses(): Promise<FixedExpense[]> {
    try {
        const { rows } = await sql<any>`SELECT * FROM fixed_expenses ORDER BY name ASC`;
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            amount: parseFloat(row.amount),
            paymentLimitDay: row.payment_limit_day
        }));
    } catch (error) {
        console.error('Failed to fetch fixed expenses:', error);
        return [];
    }
}

export async function addFixedExpense(e: FixedExpense) {
    try {
        await sql`
            INSERT INTO fixed_expenses (id, name, amount, payment_limit_day)
            VALUES (${e.id}, ${e.name}, ${e.amount}, ${e.paymentLimitDay || null})
        `;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to add fixed expense:', error);
    }
}

export async function updateFixedExpense(e: FixedExpense) {
    try {
        await sql`
            UPDATE fixed_expenses 
            SET name = ${e.name}, 
                amount = ${e.amount}, 
                payment_limit_day = ${e.paymentLimitDay || null}
            WHERE id = ${e.id}
        `;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to update fixed expense:', error);
    }
}

export async function deleteFixedExpense(id: string) {
    try {
        await sql`DELETE FROM fixed_expenses WHERE id = ${id}`;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to delete fixed expense:', error);
    }
}

// FIXED INCOMES
export async function getFixedIncomes(): Promise<FixedIncome[]> {
    try {
        await sql`CREATE TABLE IF NOT EXISTS fixed_incomes (
            id TEXT PRIMARY KEY, 
            name TEXT NOT NULL, 
            amount DECIMAL(10,2) NOT NULL, 
            payment_day INTEGER
        )`;

        const { rows } = await sql<any>`SELECT * FROM fixed_incomes ORDER BY name ASC`;
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            amount: parseFloat(row.amount),
            paymentDay: row.payment_day
        }));
    } catch (error) {
        console.error('Failed to fetch fixed incomes:', error);
        return [];
    }
}

export async function addFixedIncome(i: FixedIncome) {
    try {
        await sql`
            INSERT INTO fixed_incomes (id, name, amount, payment_day)
            VALUES (${i.id}, ${i.name}, ${i.amount}, ${i.paymentDay || null})
        `;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to add fixed income:', error);
    }
}

export async function updateFixedIncome(i: FixedIncome) {
    try {
        await sql`
            UPDATE fixed_incomes 
            SET name = ${i.name}, 
                amount = ${i.amount}, 
                payment_day = ${i.paymentDay || null}
            WHERE id = ${i.id}
        `;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to update fixed income:', error);
    }
}

export async function deleteFixedIncome(id: string) {
    try {
        await sql`DELETE FROM fixed_incomes WHERE id = ${id}`;
        revalidatePath('/cuentas');
    } catch (error) {
        console.error('Failed to delete fixed income:', error);
    }
}

// SETTINGS
export async function getSettings(): Promise<AppSettings> {
    try {
        const { rows } = await sql<any>`SELECT * FROM settings WHERE id = 1`;
        if (rows.length === 0) return { currency: 'DOP', currencySymbol: 'RD$' };
        return {
            currency: rows[0].currency,
            currencySymbol: rows[0].currency_symbol
        };
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return { currency: 'DOP', currencySymbol: 'RD$' };
    }
}

export async function updateSettings(settings: AppSettings) {
    try {
        await sql`
            UPDATE settings 
            SET currency = ${settings.currency}, 
                currency_symbol = ${settings.currencySymbol}
            WHERE id = 1
        `;
        revalidatePath('/configuracion');
    } catch (error) {
        console.error('Failed to update settings:', error);
    }
}
