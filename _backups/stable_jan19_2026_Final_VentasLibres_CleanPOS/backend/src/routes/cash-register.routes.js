const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth, checkPermission } = require('../middleware/auth');

// Obtener estado de la caja (sesión activa)
router.get('/status', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar CUALQUIER sesión abierta (Caja única compartida)
        const activeSession = await prisma.cashRegisterSession.findFirst({
            where: {
                status: 'open'
            }
        });

        if (activeSession) {
            return res.json({
                success: true,
                isOpen: true,
                data: activeSession
            });
        }

        res.json({
            success: true,
            isOpen: false,
            data: null
        });
    } catch (error) {
        console.error('Error checking register status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Abrir caja
router.post('/open', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { initialCash } = req.body;

        if (initialCash === undefined || initialCash === null) {
            return res.status(400).json({ success: false, message: 'Monto inicial requerido' });
        }

        // Verificar si YA existe una caja abierta en el sistema (Caja compartida)
        const existingSession = await prisma.cashRegisterSession.findFirst({
            where: {
                status: 'open'
            }
        });

        if (existingSession) {
            return res.status(400).json({ success: false, message: 'Ya tienes una caja abierta' });
        }

        const newSession = await prisma.cashRegisterSession.create({
            data: {
                openedById: userId,
                initialCash: parseFloat(initialCash),
                status: 'open',
                openedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Caja abierta correctamente',
            data: newSession
        });
    } catch (error) {
        console.error('Error opening register:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cerrar caja
router.post('/close', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { countedCash, notes } = req.body;

        // Buscar LA sesión abierta actual (Caja compartida)
        const session = await prisma.cashRegisterSession.findFirst({
            where: {
                status: 'open'
            }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'No hay ninguna caja abierta para cerrar' });
        }

        // Calcular totales usando daily-summary logic (simplified here or reused)
        // Para consistencia con lo que ve el usuario, idealmente deberíamos recalcularlo aquí.
        // Por simplicidad, confiaremos en lo que el backend de "sales" dice si quisieramos validar, 
        // pero aquí solo cerramos la sesión con lo que el usuario contó y lo guardamos.

        // Calcular ventas del usuario en este periodo de sesión?
        // O ventas del día (como hace el frontend)?
        // Vamos a calcular ventas vinculadas al usuario desde que abrió la caja.

        // Lógica Híbrida Robusta para Inicio de Ventas:
        // 1. Base: Empezamos contando desde que se abrió la caja.
        let startDate = session.openedAt;

        // 2. Excepción "Rescate de Ventas" (Solo si la caja se abrió HOY):
        // Si el usuario vendió antes de abrir caja hoy, queremos incluir esas ventas.
        const now = new Date();
        const rdOffset = -4;
        const todayRD = new Date(now.getTime() + (rdOffset * 60 * 60 * 1000));
        todayRD.setUTCHours(0, 0, 0, 0);
        const todayStart = new Date(todayRD.getTime() - (rdOffset * 60 * 60 * 1000));

        if (session.openedAt >= todayStart) {
            // La sesión es de hoy. Verificamos si hubo un cierre previo hoy.
            const lastClosedSession = await prisma.cashRegisterSession.findFirst({
                where: {
                    status: 'closed',
                    closedAt: {
                        gte: todayStart,
                        lt: session.openedAt
                    }
                },
                orderBy: { closedAt: 'desc' }
            });

            // Si hay cierre previo, contamos desde ahí. Si no, desde el inicio del día.
            const computedStart = lastClosedSession ? lastClosedSession.closedAt : todayStart;

            // Solo aplicamos esta fecha si es ANTERIOR a la fecha de apertura real (para "rescatar" ventas)
            if (computedStart < session.openedAt) {
                startDate = computedStart;
            }
        }

        const sales = await prisma.sale.aggregate({
            where: {
                createdAt: { gte: startDate },
                status: 'paid',
                paymentMethod: 'cash'
            },
            _sum: {
                total: true
            }
        });

        const totalSales = sales._sum.total || 0;
        const expectedCash = session.initialCash + totalSales;
        // Nota: Esto asume todas las ventas son efectivo? No.
        // Deberíamos filtrar por currency/method if complex.
        // Pero el modelo frontend usa `daily-summary` que desglosa por medio de pago.
        // Vamos a guardar lo que manda el usuario como "countedCash" y calcular diferencia simple contra "expected"
        // Si quisieramos ser precisos con "Efectivo vs Tarjeta", necesitaríamos guardar eso en la sesión.
        // Por ahora, guardamos el cierre básico.

        const discrepancy = parseFloat(countedCash) - expectedCash;

        const closedSession = await prisma.cashRegisterSession.update({
            where: { id: session.id },
            data: {
                closedAt: new Date(),
                closedById: userId, // El mismo usuario cierra (o admin podría forzar)
                countedCash: parseFloat(countedCash),
                expectedCash: expectedCash, // Esto es simplificado
                discrepancy: discrepancy,
                notes: notes,
                status: 'closed'
            }
        });

        res.json({
            success: true,
            message: 'Caja cerrada correctamente',
            data: closedSession
        });
    } catch (error) {
        console.error('Error closing register:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Obtener historial de cierres
router.get('/history', auth, checkPermission('canCreateSales'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};

        if (startDate || endDate) {
            where.openedAt = {};
            if (startDate) where.openedAt.gte = new Date(`${startDate}T00:00:00Z`);
            if (endDate) where.openedAt.lte = new Date(`${endDate}T23:59:59Z`);
        }

        const sessions = await prisma.cashRegisterSession.findMany({
            where,
            include: {
                openedBy: { select: { name: true } },
                closedBy: { select: { name: true } }
            },
            orderBy: {
                openedAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Error fetching register history:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
