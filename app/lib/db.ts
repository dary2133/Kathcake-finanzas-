
import { sql } from '@vercel/postgres';

export async function initDatabase() {
    try {
        // Create Accounts table
        await sql`
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
                "limit" DECIMAL(15, 2),
                cutoff_day INTEGER,
                payment_limit_day INTEGER
            );
        `;

        // Create Transactions table
        await sql`
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                date DATE NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                payment_method TEXT NOT NULL,
                status TEXT NOT NULL,
                location TEXT,
                due_date DATE
            );
        `;

        // Create Fixed Expenses table
        await sql`
            CREATE TABLE IF NOT EXISTS fixed_expenses (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                payment_limit_day INTEGER
            );
        `;

        // Create Settings table
        await sql`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                currency TEXT NOT NULL DEFAULT 'DOP',
                currency_symbol TEXT NOT NULL DEFAULT 'RD$'
            );
        `;

        // Insert default settings if not exists
        await sql`
            INSERT INTO settings (id, currency, currency_symbol)
            VALUES (1, 'DOP', 'RD$')
            ON CONFLICT (id) DO NOTHING;
        `;

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}
