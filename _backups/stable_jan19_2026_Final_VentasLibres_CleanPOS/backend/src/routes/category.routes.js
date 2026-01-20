const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth } = require('../middleware/auth');

// Obtener todas las categorías
router.get('/', auth, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            data: categories.map(c => ({ ...c, _id: c.id }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Crear categoría
router.post('/', auth, async (req, res) => {
    try {
        const { name, isActive } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

        const category = await prisma.category.create({
            data: {
                name,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: { ...category, _id: category.id }
        });
    } catch (error) {
        console.error('Category Create Error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
        }
        res.status(500).json({ success: false, message: 'Error de base de datos: ' + error.message });
    }
});

// Actualizar categoría
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.json({
            success: true,
            message: 'Categoría actualizada',
            data: { ...category, _id: category.id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar categoría
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si hay productos usando esta categoría
        const productCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar una categoría que tiene productos asociados'
            });
        }

        await prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
