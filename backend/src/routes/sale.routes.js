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

        // 0. Buscar sesión activa para vincular la venta
        const activeSession = await prisma.cashRegisterSession.findFirst({
            where: { status: 'open' },
            orderBy: { openedAt: 'desc' }
        });

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

                const rawUnitPrice = item.unitPrice || product.price;
                // Todos los precios ya incluyen el 18% de ITBIS. 
                // Calculamos el precio unitario sin impuesto para el subtotal interno.
                const unitPrice = rawUnitPrice / 1.18;

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

            // Cálculos finales basados en precios que ya incluyen ITBIS
            let discountAmount = 0;
            const fullTotalBruto = subtotal * 1.18; // El total real con impuestos antes de descuento

            if (discount && discount > 0) {
                discountAmount = discountType === 'percentage' ? (fullTotalBruto * discount) / 100 : discount;
            }

            const total = fullTotalBruto - discountAmount;
            const tax = total - (total / 1.18);
            const finalSubtotal = total - tax;

            // Crear la venta
            const sale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    subtotal: finalSubtotal,
                    tax,
                    discount: discountAmount,
                    discountType: discountType || 'none',
                    total,
                    paymentMethod,
                    status: status || 'paid',
                    customer: customer || {},
                    sellerId,
                    sessionId: activeSession?.id || null,
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

// Resumen diario por método de pago (para cierre de caja)
router.get('/daily-summary', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        let startDate;

        const activeSession = await prisma.cashRegisterSession.findFirst({
            where: { status: 'open' },
            orderBy: { openedAt: 'desc' }
        });

        if (activeSession) {
            startDate = activeSession.openedAt;

            const now = new Date();
            const rdOffset = -4;
            const todayRD = new Date(now.getTime() + (rdOffset * 60 * 60 * 1000));
            todayRD.setUTCHours(0, 0, 0, 0);
            const todayStart = new Date(todayRD.getTime() - (rdOffset * 60 * 60 * 1000));

            // Si la sesión es de hoy, ampliamos el rango para incluir ventas 
            // realizadas justo antes de la apertura oficial (ej. ventas rápidas)
            if (activeSession.openedAt >= todayStart) {
                startDate = todayStart;
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

        const [salesByMethod, expenses] = await Promise.all([
            prisma.sale.groupBy({
                by: ['paymentMethod'],
                where: {
                    OR: [
                        { sessionId: activeSession?.id },
                        {
                            createdAt: { gte: startDate },
                            sessionId: null // Fallback para ventas sin sesión vinculada (compatibilidad)
                        }
                    ],
                    status: 'paid'
                },
                _sum: {
                    total: true
                },
                _count: true
            }),
            prisma.expense.aggregate({
                where: {
                    OR: [
                        { sessionId: activeSession?.id },
                        {
                            createdAt: { gte: startDate },
                            sessionId: null
                        }
                    ],
                },
                _sum: {
                    amount: true
                }
            })
        ]);

        const summary = {
            cash: 0,
            card: 0,
            transfer: 0,
            other: 0,
            totalSales: 0,
            totalExpenses: expenses._sum.amount || 0,
            balance: 0
        };

        salesByMethod.forEach(item => {
            const method = item.paymentMethod || 'other';
            const amount = item._sum.total || 0;
            if (summary[method] !== undefined) {
                summary[method] = amount;
            } else {
                summary.other += amount;
            }
            summary.totalSales += amount;
        });

        summary.balance = summary.totalSales - summary.totalExpenses;

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error daily summary:', error);
        res.status(500).json({ success: false, message: error.message });
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

// Eliminar una venta
router.delete('/:id', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        const { id } = req.params;

        // Iniciar transacción
        await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!sale) throw new Error('Venta no encontrada');

            // 1. Restaurar stock de los productos (solo si no es venta libre)
            for (const item of sale.items) {
                // Verificar si es el producto de venta libre
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (product && product.isActive) { // Los productos de venta libre tienen isActive: false
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });
                }
            }

            // 2. Eliminar items de la venta
            await tx.saleItem.deleteMany({
                where: { saleId: id }
            });

            // 3. Eliminar la venta
            await tx.sale.delete({
                where: { id }
            });
        });

        res.json({ success: true, message: 'Venta eliminada y stock restaurado' });
    } catch (error) {
        console.error('Error deleting sale:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Actualizar una venta (completo)
router.patch('/:id', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        const { id } = req.params;
        const { items, customer, paymentMethod, status, createdAt } = req.body;

        await prisma.$transaction(async (tx) => {
            const oldSale = await tx.sale.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!oldSale) throw new Error('Venta no encontrada');

            // 1. Restaurar stock antiguo
            for (const item of oldSale.items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (product && product.isActive) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });
                }
            }

            // 2. Eliminar items antiguos
            await tx.saleItem.deleteMany({ where: { saleId: id } });

            // 3. Procesar nuevos items y actualizar stock
            let subtotal = 0;
            const processedItems = [];

            for (const item of items) {
                let product;
                let isFreeSale = false;

                if (item.product === 'venta-libre' || item.productId === 'venta-libre') {
                    isFreeSale = true;
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
                                isActive: false
                            }
                        });
                    }
                } else {
                    product = await tx.product.findUnique({ where: { id: item.productId || item.product } });
                }

                if (!product) throw new Error(`Producto ${item.productName || item.product} no encontrado`);

                if (!isFreeSale) isFreeSale = !product.isActive;

                const rawUnitPrice = item.unitPrice || product.price;
                const unitPrice = isFreeSale ? (rawUnitPrice / 1.18) : rawUnitPrice;
                const itemSubtotal = unitPrice * item.quantity;
                subtotal += itemSubtotal;

                processedItems.push({
                    productId: product.id,
                    productName: item.productName || product.name,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    subtotal: itemSubtotal
                });

                if (!isFreeSale) {
                    await tx.product.update({
                        where: { id: product.id },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }

            // 4. Recalcular totales
            const discountAmount = oldSale.discount || 0;
            const tax = (subtotal - discountAmount) * 0.18;
            const total = subtotal + tax - discountAmount;

            // 5. Actualizar la venta
            return await tx.sale.update({
                where: { id },
                data: {
                    subtotal,
                    tax,
                    total,
                    paymentMethod: paymentMethod || oldSale.paymentMethod,
                    status: status || oldSale.status,
                    customer: customer || oldSale.customer,
                    createdAt: createdAt ? new Date(createdAt) : oldSale.createdAt,
                    items: {
                        create: processedItems
                    }
                }
            });
        });

        res.json({ success: true, message: 'Venta actualizada correctamente' });
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Actualizar detalles de la venta (como el nombre/cliente)
router.patch('/:id/details', auth, async (req, res) => {
    try {
        const { customerName } = req.body;
        const { id } = req.params;

        const sale = await prisma.sale.update({
            where: { id },
            data: {
                customer: {
                    name: customerName
                }
            }
        });

        res.json({ success: true, message: 'Nombre de venta actualizado', data: sale });
    } catch (error) {
        console.error('Error updating sale details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
