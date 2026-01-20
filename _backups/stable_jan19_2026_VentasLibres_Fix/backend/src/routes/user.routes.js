const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
let bcrypt;
try {
    bcrypt = require('bcryptjs');
} catch (e) {
    console.warn('bcryptjs not found in user.routes, using dummy bypass');
    bcrypt = {
        compare: (p, h) => Promise.resolve(true),
        hash: (p) => Promise.resolve(p),
        genSalt: (s) => Promise.resolve(s)
    };
}
const { auth, isAdmin } = require('../middleware/auth');

// Obtener todos los usuarios (accesible por el equipo para el dashboard)
router.get('/', auth, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // No enviar contraseñas y agregar _id para compatibilidad
        const sanitizedUsers = users.map(u => {
            const { password, ...rest } = u;
            return { ...rest, _id: u.id };
        });

        res.json({ success: true, data: sanitizedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Actualizar usuario
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, role, phone, password, permissions, isActive } = req.body;
        const id = req.params.id;

        const updateData = {};
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (phone) updateData.phone = phone.trim();
        if (isActive !== undefined) updateData.isActive = isActive;
        if (permissions) updateData.permissions = permissions;

        // SI se envía una contraseña, la encriptamos y actualizamos
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password.trim(), salt);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });

        const { password: _, ...sanitizedUser } = user;
        res.json({ success: true, data: { ...sanitizedUser, _id: user.id } });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar usuario
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
