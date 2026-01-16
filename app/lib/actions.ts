
'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { Transaction, Account, FixedExpense, FixedIncome, AppSettings, TransactionType } from './types';

// ACCOUNTS
export async function getAccounts(): Promise<Account[]> {
    try {
        await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'PERSONAL'`;
        const { rows } = await sql<any>`SELECT * FROM accounts ORDER BY name ASC`;
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type,
            balance: parseFloat(row.balance),
            limit: row.limit ? parseFloat(row.limit) : undefined,
            cutoffDay: row.cutoff_day,
            paymentLimitDay: row.payment_limit_day,
            category: row.category as 'PERSONAL' | 'KATHCAKE'
        }));
    } catch (error) {
        console.error('Failed to fetch accounts:', error);
        return [];
    }
}

export async function addAccount(account: Account) {
    try {
        await sql`
            INSERT INTO accounts (id, name, type, balance, "limit", cutoff_day, payment_limit_day, category)
            VALUES (${account.id}, ${account.name}, ${account.type}, ${account.balance}, ${account.limit || null}, ${account.cutoffDay || null}, ${account.paymentLimitDay || null}, ${account.category || 'PERSONAL'})
        `;
        revalidatePath('/cuentas');
        revalidatePath('/cuentas-kathcake');
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
                payment_limit_day = ${account.paymentLimitDay || null},
                category = ${account.category || 'PERSONAL'}
            WHERE id = ${account.id}
        `;
        revalidatePath('/cuentas');
        revalidatePath('/cuentas-kathcake');
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
        await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_category TEXT DEFAULT 'PERSONAL'`;
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
            dueDate: row.due_date ? row.due_date.toISOString().split('T')[0] : undefined,
            transactionCategory: row.transaction_category as 'PERSONAL' | 'KATHCAKE'
        }));
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
    }
}

export async function addTransaction(t: Transaction) {
    try {
        await sql`
            INSERT INTO transactions (id, date, type, category, description, amount, payment_method, status, location, due_date, transaction_category)
            VALUES (${t.id}, ${t.date}, ${t.type}, ${t.category}, ${t.description}, ${t.amount}, ${t.paymentMethod}, ${t.status}, ${t.location || null}, ${t.dueDate || null}, ${t.transactionCategory || 'PERSONAL'})
        `;
        revalidatePath('/ingresos');
        revalidatePath('/gastos');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to add transaction:', error);
    }
}

export async function registerCardExpense(t: Transaction, accountId: string) {
    try {
        // 1. Add Transaction
        await sql`
            INSERT INTO transactions (id, date, type, category, description, amount, payment_method, status, location, due_date)
            VALUES (${t.id}, ${t.date}, ${t.type}, ${t.category}, ${t.description}, ${t.amount}, ${t.paymentMethod}, ${t.status}, ${t.location || null}, ${t.dueDate || null})
        `;

        // 2. Update Account Balance (Increase Debt)
        await sql`
            UPDATE accounts 
            SET balance = balance + ${t.amount}
            WHERE id = ${accountId}
        `;

        revalidatePath('/cuentas');
        revalidatePath('/gastos');
        revalidatePath('/');
    } catch (error) {
        console.error('Failed to register card expense:', error);
        throw error;
    }
}

export async function addTransactions(list: Transaction[]) {
    try {
        for (const t of list) {
            await sql`
                INSERT INTO transactions (id, date, type, category, description, amount, payment_method, status, location, due_date, transaction_category)
                VALUES (${t.id}, ${t.date}, ${t.type}, ${t.category}, ${t.description}, ${t.amount}, ${t.paymentMethod}, ${t.status}, ${t.location || null}, ${t.dueDate || null}, ${t.transactionCategory || 'PERSONAL'})
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
                due_date = ${t.dueDate || null},
                transaction_category = ${t.transactionCategory || 'PERSONAL'}
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
        // Lazy migration: Ensure column exists
        await sql`ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS start_date DATE`;
        await sql`ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'PERSONAL'`;

        const { rows } = await sql<any>`SELECT * FROM fixed_expenses ORDER BY name ASC`;
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            amount: parseFloat(row.amount),
            paymentLimitDay: row.payment_limit_day,
            startDate: row.start_date ? row.start_date.toISOString().split('T')[0] : undefined,
            category: row.category as 'PERSONAL' | 'KATHCAKE'
        }));
    } catch (error) {
        console.error('Failed to fetch fixed expenses:', error);
        return [];
    }
}

export async function addFixedExpense(e: FixedExpense) {
    try {
        await sql`
            INSERT INTO fixed_expenses (id, name, amount, payment_limit_day, start_date, category)
            VALUES (${e.id}, ${e.name}, ${e.amount}, ${e.paymentLimitDay || null}, ${e.startDate || null}, ${e.category || 'PERSONAL'})
        `;
        revalidatePath('/cuentas');
        revalidatePath('/cuentas-kathcake');
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
                payment_limit_day = ${e.paymentLimitDay || null},
                start_date = ${e.startDate || null},
                category = ${e.category || 'PERSONAL'}
            WHERE id = ${e.id}
        `;
        revalidatePath('/cuentas');
        revalidatePath('/cuentas-kathcake');
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
            payment_day INTEGER,
            category TEXT DEFAULT 'PERSONAL'
        )`;
        await sql`ALTER TABLE fixed_incomes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'PERSONAL'`;

        const { rows } = await sql<any>`SELECT * FROM fixed_incomes ORDER BY name ASC`;
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            amount: parseFloat(row.amount),
            paymentDay: row.payment_day,
            category: row.category as 'PERSONAL' | 'KATHCAKE'
        }));
    } catch (error) {
        console.error('Failed to fetch fixed incomes:', error);
        return [];
    }
}

export async function addFixedIncome(i: FixedIncome) {
    try {
        await sql`
            INSERT INTO fixed_incomes (id, name, amount, payment_day, category)
            VALUES (${i.id}, ${i.name}, ${i.amount}, ${i.paymentDay || null}, ${i.category || 'PERSONAL'})
        `;
        revalidatePath('/cuentas');
        revalidatePath('/cuentas-kathcake');
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
                payment_day = ${i.paymentDay || null},
                category = ${i.category || 'PERSONAL'}
            WHERE id = ${i.id}
        `;
        revalidatePath('/cuentas');
        revalidatePath('/cuentas-kathcake');
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
        // Ensure table and columns exist
        await sql`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, currency TEXT, currency_symbol TEXT)`;
        await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS income_descriptions TEXT`;
        await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS expense_descriptions TEXT`;

        const { rows } = await sql<any>`SELECT * FROM settings WHERE id = 1`;
        if (rows.length === 0) {
            const defaults = {
                currency: 'DOP',
                currencySymbol: 'RD$',
                incomeDescriptions: [
                    'BIZCOCHO DE VAINILLA 1/2 LB', 'BIZCOCHO DE VAINILLA 1 LB O MAS',
                    'BIZCOCHO DE CHOCOLATE 1/2 LB', 'BIZCOCHO DE CHOCOLATE 1 LB O MAS',
                    'VENTA DEL DIA', 'CHEESCAKE COMPLETO', 'FLAN COMPLETO',
                    'CHOCOFLAN COMPLETO', 'BESO DE ANGEL COMPLETO'
                ],
                expenseDescriptions: [
                    'MANTEQUILLA', 'HARINA', 'AZUCAR', 'LECHE ENTERA', 'LECHE CONDENSADA',
                    'CREMA DE LECHE', 'CREMA CHANTILLY', 'CACAO', 'CHOCOLATE COBERTURA',
                    'FRESAS', 'GASTOS PERSONALES', 'COCO Y LECHE DE COCO', 'HUEVOS',
                    'CHINOLA', 'COCTELES', 'NTD INGREDIENTES', 'AGUA', 'PAGO SAN', 'GAS',
                    'QUESO CREMA', 'PAPELERIA', 'REDONDELES Y FON', 'CAJAS PARA BIZCOCHOS',
                    'TRANSPORTE PEDIDOS', 'RON', 'CHISPAS DE CHOCOLATE', 'LECHE EVAPORADA',
                    'DULCE DE LECHE', 'MATERIALES PARA DECORACION', 'MATERIALES COMPLEMENTARIOS',
                    'CHUGAR SHOP', 'YOSHIDA', 'MANGAS DE RELLENOS', 'CUCHARAS',
                    'PLATOS DESECHABLES PARA PORCIONES', 'TRANSPORTE', 'SALARIO KATHERINE',
                    'GALLETA OREO O MARIA', 'SALARIO DIARIO KRISBEL', 'RENTA DIARIA',
                    'REFRESCOS Y AGUA', 'MATERIALES DE LIMPIEZA', 'ENERGIA ELECTRICA DIARIA',
                    'ACEITE', 'PAGO INTERNET'
                ]
            };
            await sql`
                INSERT INTO settings (id, currency, currency_symbol, income_descriptions, expense_descriptions)
                VALUES (1, ${defaults.currency}, ${defaults.currencySymbol}, ${JSON.stringify(defaults.incomeDescriptions)}, ${JSON.stringify(defaults.expenseDescriptions)})
            `;
            return defaults;
        }

        const defaultIncomes = [
            'BIZCOCHO DE VAINILLA 1/2 LB', 'BIZCOCHO DE VAINILLA 1 LB O MAS',
            'BIZCOCHO DE CHOCOLATE 1/2 LB', 'BIZCOCHO DE CHOCOLATE 1 LB O MAS',
            'VENTA DEL DIA', 'CHEESCAKE COMPLETO', 'FLAN COMPLETO',
            'CHOCOFLAN COMPLETO', 'BESO DE ANGEL COMPLETO'
        ];

        const defaultExpenses = [
            'MANTEQUILLA', 'HARINA', 'AZUCAR', 'LECHE ENTERA', 'LECHE CONDENSADA',
            'CREMA DE LECHE', 'CREMA CHANTILLY', 'CACAO', 'CHOCOLATE COBERTURA',
            'FRESAS', 'GASTOS PERSONALES', 'COCO Y LECHE DE COCO', 'HUEVOS',
            'CHINOLA', 'COCTELES', 'NTD INGREDIENTES', 'AGUA', 'PAGO SAN', 'GAS',
            'QUESO CREMA', 'PAPELERIA', 'REDONDELES Y FON', 'CAJAS PARA BIZCOCHOS',
            'TRANSPORTE PEDIDOS', 'RON', 'CHISPAS DE CHOCOLATE', 'LECHE EVAPORADA',
            'DULCE DE LECHE', 'MATERIALES PARA DECORACION', 'MATERIALES COMPLEMENTARIOS',
            'CHUGAR SHOP', 'YOSHIDA', 'MANGAS DE RELLENOS', 'CUCHARAS',
            'PLATOS DESECHABLES PARA PORCIONES', 'TRANSPORTE', 'SALARIO KATHERINE',
            'GALLETA OREO O MARIA', 'SALARIO DIARIO KRISBEL', 'RENTA DIARIA',
            'REFRESCOS Y AGUA', 'MATERIALES DE LIMPIEZA', 'ENERGIA ELECTRICA DIARIA',
            'ACEITE', 'PAGO INTERNET'
        ];

        let incomeDescriptions = rows[0].income_descriptions ? JSON.parse(rows[0].income_descriptions) : [];
        let expenseDescriptions = rows[0].expense_descriptions ? JSON.parse(rows[0].expense_descriptions) : [];

        // If DB is empty, provide defaults so user can edit them in Config page
        if (incomeDescriptions.length === 0) incomeDescriptions = defaultIncomes;
        if (expenseDescriptions.length === 0) expenseDescriptions = defaultExpenses;

        return {
            currency: rows[0].currency,
            currencySymbol: rows[0].currency_symbol,
            incomeDescriptions,
            expenseDescriptions
        };
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return { currency: 'DOP', currencySymbol: 'RD$', incomeDescriptions: [], expenseDescriptions: [] };
    }
}

export async function updateSettings(settings: AppSettings) {
    try {
        await sql`
            UPDATE settings 
            SET currency = ${settings.currency}, 
                currency_symbol = ${settings.currencySymbol},
                income_descriptions = ${JSON.stringify(settings.incomeDescriptions || [])},
                expense_descriptions = ${JSON.stringify(settings.expenseDescriptions || [])}
            WHERE id = 1
        `;
        revalidatePath('/configuracion');
    } catch (error) {
        console.error('Failed to update settings:', error);
    }
}
