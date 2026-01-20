const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth } = require('../middleware/auth');

// Crear nuevo movimiento (Gasto) usando Prisma
router.post('/', auth, async (req, res) => {
    try {
        const { date, category, amount, name, provider, paymentMethod, status } = req.body;

        // Buscar sesión activa para vincular el gasto
        const activeSession = await prisma.cashRegisterSession.findFirst({
            where: { status: 'open' },
            orderBy: { openedAt: 'desc' }
        });

        // Crear gasto en Postgres via Prisma
        const expense = await prisma.expense.create({
            data: {
                description: name || 'Gasto General',
                amount: parseFloat(amount),
                category,
                date: date ? new Date(date) : new Date(),
                paymentMethod,
                provider: provider || null,
                status: status || 'paid',
                userId: req.user.id,
                sessionId: activeSession?.id || null
            }
        });

        res.status(201).json({
            success: true,
            message: 'Gasto registrado exitosamente',
            data: expense
        });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Obtener movimientos (Sales + Expenses)
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, search, type } = req.query; // type: income, expense, all

        const movements = [];

        // 1. Fetch Sales (Income) if type is 'income' or 'all' (or undefined)
        if (!type || type === 'all' || type === 'income') {
            const where = { status: 'paid' };
            if (startDate || endDate) {
                where.createdAt = {};
                const rdOffset = 4;
                if (startDate) {
                    const sDate = new Date(`${startDate}T00:00:00Z`);
                    sDate.setUTCHours(sDate.getUTCHours() + rdOffset);
                    where.createdAt.gte = sDate;
                }
                if (endDate) {
                    const eDate = new Date(`${endDate}T23:59:59Z`);
                    eDate.setUTCHours(eDate.getUTCHours() + rdOffset);
                    where.createdAt.lte = eDate;
                }
            }

            const sales = await prisma.sale.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    total: true,
                    createdAt: true,
                    paymentMethod: true,
                    invoiceNumber: true,
                    status: true,
                    customer: true,
                    items: {
                        select: {
                            productName: true,
                            quantity: true
                        }
                    }
                }
            });

            sales.forEach(s => {
                let description = `Venta #${s.invoiceNumber}`;

                // Prioridad: Mostrar el nombre personalizado si existe (y no es el default), sino mostrar items
                const custName = (s.customer && typeof s.customer === 'object') ? s.customer.name : null;
                const isDefault = !custName || custName === 'Cliente de Mostrador' || custName === 'Cliente Genérico';

                if (!isDefault) {
                    description = custName;
                } else if (s.items && s.items.length > 0) {
                    description = s.items.map(item => `${item.quantity} ${item.productName}`).join(', ');
                } else if (custName) {
                    description = custName;
                }

                movements.push({
                    _id: s.id,
                    type: 'income',
                    category: 'Venta',
                    amount: s.total,
                    description: description,
                    createdAt: s.createdAt,
                    paymentMethod: s.paymentMethod,
                    reference: s.invoiceNumber,
                    status: s.status
                });
            });
        }

        // 2. Fetch Expenses (Expense) if type is 'expense' or 'all' (or undefined)
        if (!type || type === 'all' || type === 'expense') {
            const expenseWhere = {};

            if (startDate || endDate) {
                expenseWhere.date = {};
                // Ajuste de fecha para coincidir con la query de ventas lo mejor posible
                if (startDate) {
                    expenseWhere.date.gte = new Date(`${startDate}T00:00:00Z`);
                }
                if (endDate) {
                    expenseWhere.date.lte = new Date(`${endDate}T23:59:59Z`);
                }
            }

            // We fetch from Prisma
            const expenses = await prisma.expense.findMany({
                where: expenseWhere,
                orderBy: { date: 'desc' }
            });

            expenses.forEach(e => {
                movements.push({
                    _id: e.id,
                    type: 'expense',
                    category: e.category,
                    amount: e.amount,
                    description: e.description,
                    createdAt: e.date,
                    paymentMethod: e.paymentMethod,
                    reference: e.provider || '-',
                    status: e.status
                });
            });
        }

        // Filter by search
        let filteredMovements = movements;
        if (search) {
            const lowSearch = search.toLowerCase();
            filteredMovements = movements.filter(m =>
                m.description.toLowerCase().includes(lowSearch) ||
                (m.paymentMethod && m.paymentMethod.toLowerCase().includes(lowSearch)) ||
                (m.reference && m.reference.toLowerCase().includes(lowSearch))
            );
        }

        // Sort combined list by date desc
        filteredMovements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calculate summary
        const income = filteredMovements.filter(m => m.type === 'income').reduce((acc, m) => acc + m.amount, 0);
        const expense = filteredMovements.filter(m => m.type === 'expense').reduce((acc, m) => acc + m.amount, 0);

        res.json({
            success: true,
            data: filteredMovements,
            summary: {
                balance: income - expense,
                income,
                expense
            }
        });
    } catch (error) {
        console.error('Movements error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
