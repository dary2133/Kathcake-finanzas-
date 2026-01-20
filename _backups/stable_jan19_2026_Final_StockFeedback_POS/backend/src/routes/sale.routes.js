const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth, checkPermission } = require('../middleware/auth');

// Crear nueva venta
router.post('/', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        const { items, customer, paymentMethod, discount, discountType, status, createdAt } = req.body;
        const sellerId = req.user.id;

        console.log('Creating sale:', JSON.stringify({
            paymentMethod,
            itemsCount: items.length,
            total: req.body.total,
            seller: sellerId
        }, null, 2));

        // Generar número de factura (Formato: FACT-YYYY-000000)
        const saleDate = createdAt ? new Date(createdAt) : new Date();
        const year = saleDate.getFullYear();
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
                let product;
                let isFreeSale = false;

                if (item.product === 'venta-libre') {
                    isFreeSale = true;
                    // Buscar o crear producto especial para ventas libres (oculto de inventario)
                    product = await tx.product.findFirst({
                        where: { name: { contains: 'Venta Libre', mode: 'insensitive' } }
                    });

                    if (!product) {
                        product = await tx.product.create({
                            data: {
                                name: 'Venta Libre',
                                description: 'Producto genérico para ventas no registradas',
                                category: 'general',
                                price: 0,
                                stock: 999999,
                                isActive: false // OCULTO DEL INVENTARIO
                            }
                        });
                    }
                } else {
                    product = await tx.product.findUnique({ where: { id: item.product } });
                }

                if (!product) throw new Error(`Producto ${item.product} no encontrado`);

                if (!isFreeSale && product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name}`);
                }

                const rawUnitPrice = item.unitPrice || product.price;
                // Si es venta libre, el precio ya tiene ITBIS (monto final). 
                // Lo dividimos por 1.18 para obtener el subtotal interno.
                const unitPrice = isFreeSale ? (rawUnitPrice / 1.18) : rawUnitPrice;

                const itemSubtotal = unitPrice * item.quantity;
                subtotal += itemSubtotal;

                processedItems.push({
                    productId: product.id,
                    productName: isFreeSale ? (item.productName || 'Venta Libre') : product.name,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    subtotal: itemSubtotal
                });

                // Solo actualizar stock si no es venta libre
                if (!isFreeSale) {
                    await tx.product.update({
                        where: { id: product.id },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }

            // Cálculos
            let discountAmount = 0;
            if (discount && discount > 0) {
                discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
            }

            const tax = (subtotal - discountAmount) * 0.18; // 18% ITBIS RD
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
                    status: status || 'paid',
                    customer: customer || {},
                    sellerId,
                    createdAt: saleDate,
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
            const rdOffset = 4; // Horas a sumar para llegar a UTC desde RD

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

        // Estadísticas básicas ajustadas a República Dominicana (UTC-4)
        const now = new Date();
        const rdOffset = -4; // RD es UTC-4

        // Obtener inicio de hoy en RD
        const todayRD = new Date(now.getTime() + (rdOffset * 60 * 60 * 1000));
        todayRD.setUTCHours(0, 0, 0, 0);
        const todayStart = new Date(todayRD.getTime() - (rdOffset * 60 * 60 * 1000));

        // Obtener inicio de mes en RD
        const monthRD = new Date(todayRD);
        monthRD.setUTCDate(1);
        const monthStart = new Date(monthRD.getTime() - (rdOffset * 60 * 60 * 1000));

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
                        gte: new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1),
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

// Actualizar detalles de una venta (ej. nota/nombre post-creación)
router.patch('/:id/details', auth, async (req, res) => {
    try {
        const { note, customerName } = req.body;

        const sale = await prisma.sale.findUnique({ where: { id: req.params.id } });
        if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada' });

        // Update customer JSON
        const updatedCustomer = {
            ...(sale.customer || {}),
        };

        if (customerName) updatedCustomer.name = customerName;
        if (note) updatedCustomer.note = note;

        const updatedSale = await prisma.sale.update({
            where: { id: req.params.id },
            data: {
                customer: updatedCustomer
            }
        });

        res.json({ success: true, data: updatedSale });
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resumen diario por método de pago (para cierre de caja)
router.get('/daily-summary', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        let startDate;

        const activeSession = await prisma.cashRegisterSession.findFirst({
            where: { status: 'open' }
        });

        if (activeSession) {
            startDate = activeSession.openedAt;

            const now = new Date();
            const rdOffset = -4;
            const todayRD = new Date(now.getTime() + (rdOffset * 60 * 60 * 1000));
            todayRD.setUTCHours(0, 0, 0, 0);
            const todayStart = new Date(todayRD.getTime() - (rdOffset * 60 * 60 * 1000));

            if (activeSession.openedAt >= todayStart) {
                const lastClosedSession = await prisma.cashRegisterSession.findFirst({
                    where: {
                        status: 'closed',
                        closedAt: {
                            gte: todayStart,
                            lt: activeSession.openedAt
                        }
                    },
                    orderBy: { closedAt: 'desc' }
                });

                const computedStart = lastClosedSession ? lastClosedSession.closedAt : todayStart;
                if (computedStart < activeSession.openedAt) {
                    startDate = computedStart;
                }
            }
        } else {
            const now = new Date();
            const rdOffset = -4;
            const todayRD = new Date(now.getTime() + (rdOffset * 60 * 60 * 1000));
            todayRD.setUTCHours(0, 0, 0, 0);
            const todayStart = new Date(todayRD.getTime() - (rdOffset * 60 * 60 * 1000));

            const lastClosedSession = await prisma.cashRegisterSession.findFirst({
                where: {
                    status: 'closed',
                    closedAt: { gte: todayStart }
                },
                orderBy: { closedAt: 'desc' }
            });

            startDate = lastClosedSession ? lastClosedSession.closedAt : todayStart;
        }

        const salesByMethod = await prisma.sale.groupBy({
            by: ['paymentMethod'],
            where: {
                createdAt: { gte: startDate },
                status: 'paid'
            },
            _sum: {
                total: true
            },
            _count: true
        });

        const summary = {
            cash: 0,
            card: 0,
            transfer: 0,
            other: 0,
            total: 0
        };

        salesByMethod.forEach(item => {
            const method = item.paymentMethod || 'other';
            const amount = item._sum.total || 0;
            if (summary[method] !== undefined) {
                summary[method] = amount;
            } else {
                summary.other += amount;
            }
            summary.total += amount;
        });

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error daily summary:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
