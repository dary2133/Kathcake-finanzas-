export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PAID' | 'PENDING';


export interface Transaction {
    id: string;
    date: string;            // ISO Date (YYYY-MM-DD)
    type: TransactionType;
    category: string;        // 'Gastos Fijos', 'Insumos', 'Ventas', etc.
    description: string;     // Detail of the movement
    amount: number;
    attachmentUrl?: string; // URL or base64 of uploaded PDF/JPG/Excel
    paymentMethod: string;   // 'Tarjeta', 'Efectivo', 'Transferencia'
    transactionCategory?: 'PERSONAL' | 'KATHCAKE';

    // Specific fields found in Sheet
    location?: string;       // Matches 'UBICACION' (e.g., Bank, Cash Box)
    dueDate?: string;        // Matches 'FECHAS LIMITES DE PAGO'
    cardCutoffDate?: string; // Matches 'FECHAS DE CORTE DE TARJETAS'
    status: TransactionStatus;
}

export interface Account {
    id: string;
    name: string;        // e.g., 'Caja Chica', 'Banco Mercantil'
    type: 'CASH' | 'BANK' | 'CREDIT' | 'INVESTMENT';
    balance: number;     // For Credit Cards, this is the Debt (Positive number = Debt)
    category?: 'PERSONAL' | 'KATHCAKE';

    // Specific for Credit Cards
    limit?: number;        // Credit Limit
    cutoffDay?: number;    // Day of the month (e.g., 7)
    paymentLimitDay?: number; // Day of the month (e.g., 28)
}

export type AccountType = Account['type'];

export interface AppSettings {
    currency: string;
    currencySymbol: string;
}

export interface FixedExpense {
    id: string;
    name: string;      // e.g. "Alquiler Casa", "Energia Electrica"
    amount: number;
    paymentLimitDay?: number; // e.g. 5 (means 5th of each month)
    startDate?: string; // ISO Date (YYYY-MM-DD) indicating the first payment or anchor date
    category?: 'PERSONAL' | 'KATHCAKE';
}

export interface FixedIncome {
    id: string;
    name: string;      // e.g. "Salario", "Alquiler Local"
    amount: number;
    paymentDay?: number; // e.g. 15 or 30
    category?: 'PERSONAL' | 'KATHCAKE';
}

export interface ParsedRecord {
    date: string;
    description: string;
    category: string;
    amount: number;
    type: TransactionType;
    quantity?: number;
    attachmentUrl?: string;
}
