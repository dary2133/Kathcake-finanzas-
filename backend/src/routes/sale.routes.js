const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth } = require('../middleware/auth');

// Crear nueva venta
router.post('/', auth, async (req, res) => {
    try {
        const { items, customer, paymentMethod, discount, discountType } = req.body;
        const sellerId = req.user.id;

        // Generar número de factura (Formato: FACT-YYYY-000000)
        const year = new Date().getFullYear();
        const count = await prisma.sale.count({
            where: {
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`)
                }
            }
        });
        const invoiceNumber = `FACT-${year}-${String(count + 1).padStart(6, '0')}`;

        // Iniciar transacción para asegurar consistencia
        const result = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const processedItems = [];

            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: item.product } });
                if (!product) throw new Error(`Producto ${item.product} no encontrado`);

                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name}`);
                }

                const unitPrice = item.unitPrice || product.price;
                const itemSubtotal = unitPrice * item.quantity;
                subtotal += itemSubtotal;

                processedItems.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    subtotal: itemSubtotal
                });

                // Actualizar stock
                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: { decrement: item.quantity } }
                });
            }

            // Cálculos
            let discountAmount = 0;
            if (discount && discount > 0) {
                discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
            }

            const tax = (subtotal - discountAmount) * 0.16; // 16% IVA ejemplo
            const total = subtotal + tax - discountAmount;

            // Crear la venta
            const sale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    subtotal,
                    tax,
                    discount: discountAmount,
                    discountType: discountType || 'none',
                    total,
                    paymentMethod,
                    status: 'paid',
                    customer: customer || {},
                    sellerId,
                    items: {
                        create: processedItems
                    }
                },
                include: {
                    items: true,
                    seller: { select: { name: true, email: true } }
                }
            });

            return sale;
        });

        res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            data: { ...result, _id: result.id }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Obtener todas las ventas
router.get('/', auth, async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            seller,
            status,
            page = 1,
            limit = 50
        } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (seller) where.sellerId = seller;
        if (status) where.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const sales = await prisma.sale.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            include: {
                seller: { select: { name: true, email: true } },
                items: true
            }
        });

        const mappedSales = sales.map(s => ({ ...s, _id: s.id }));

        const total = await prisma.sale.count({ where });

        // Estadísticas básicas
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [todayStats, monthStats, lastMonthStats] = await Promise.all([
            prisma.sale.aggregate({
                where: { createdAt: { gte: todayStart }, status: 'paid' },
                _sum: { total: true },
                _count: true
            }),
            prisma.sale.aggregate({
                where: { createdAt: { gte: monthStart }, status: 'paid' },
                _sum: { total: true },
                _count: true
            }),
            prisma.sale.aggregate({
                where: {
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                        lt: monthStart
                    },
                    status: 'paid'
                },
                _sum: { total: true },
                _count: true
            })
        ]);

        // Calcular crecimiento
        const currentMonthTotal = monthStats._sum.total || 0;
        const lastMonthTotal = lastMonthStats._sum.total || 0;
        let growth = 0;

        if (lastMonthTotal > 0) {
            growth = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        } else if (currentMonthTotal > 0) {
            growth = 100;
        }

        res.json({
            success: true,
            data: mappedSales,
            statistics: {
                today: { total: todayStats._sum.total || 0, count: todayStats._count },
                month: { total: monthStats._sum.total || 0, count: monthStats._count },
                growth: growth.toFixed(1) + '%'
            },
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / take),
                limit: take
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Obtener detalle de una venta
router.get('/:id', auth, async (req, res) => {
    try {
        const sale = await prisma.sale.findUnique({
            where: { id: req.params.id },
            include: {
                seller: { select: { name: true, email: true } },
                items: true
            }
        });

        if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada' });

        res.json({ success: true, data: { ...sale, _id: sale.id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
