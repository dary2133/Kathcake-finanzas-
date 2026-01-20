const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth } = require('../middleware/auth');

// Obtener todos los clientes
router.get('/', auth, async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Crear cliente
router.post('/', auth, async (req, res) => {
    try {
        const customer = await prisma.customer.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Actualizar cliente
router.put('/:id', auth, async (req, res) => {
    try {
        const customer = await prisma.customer.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar cliente (soft delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        await prisma.customer.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ success: true, message: 'Cliente eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
