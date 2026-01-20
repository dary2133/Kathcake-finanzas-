const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth } = require('../middleware/auth');

// Obtener configuración
router.get('/', auth, async (req, res) => {
    try {
        let setting = await prisma.setting.findFirst();
        if (!setting) {
            // Crear configuración inicial si no existe
            setting = await prisma.setting.create({
                data: { id: 'global' }
            });
        }
        res.json({ success: true, data: setting });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Guardar/Actualizar configuración
router.post('/', auth, async (req, res) => {
    try {
        const data = { ...req.body };
        delete data.id;
        delete data.updatedAt;

        const setting = await prisma.setting.upsert({
            where: { id: 'global' },
            update: data,
            create: { ...data, id: 'global' }
        });

        res.json({ success: true, message: 'Configuración guardada', data: setting });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
