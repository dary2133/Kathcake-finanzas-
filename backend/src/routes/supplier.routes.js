const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth } = require('../middleware/auth');

// Obtener todos los proveedores
router.get('/', auth, async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Crear proveedor
router.post('/', auth, async (req, res) => {
    try {
        const supplier = await prisma.supplier.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Actualizar proveedor
router.put('/:id', auth, async (req, res) => {
    try {
        const supplier = await prisma.supplier.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar proveedor (soft delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        await prisma.supplier.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ success: true, message: 'Proveedor eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
