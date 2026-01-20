const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error('Token no proporcionado');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kath_secret_fallback');

        // El socio "safe-admin" no requiere DB
        if (decoded.userId === 'admin-1' || decoded.userId === 'admin-2') {
            req.user = { id: decoded.userId, role: 'admin', permissions: { all: true } };
            req.token = token;
            return next();
        }

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId
            }
        });

        if (!user || !user.isActive) {
            throw new Error('Usuario no encontrado o inactivo');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Por favor autentícate'
        });
    }
};

const checkPermission = (permission) => {
    return (req, res, next) => {
        // Mapeo de permisos maestros a granulares
        const masterPermMap = {
            'canCreateProducts': ['inventory', 'canManageInventory'],
            'canEditProducts': ['inventory', 'canManageInventory'],
            'canDeleteProducts': ['inventory', 'canManageInventory'],
            'canManageInventory': ['inventory'],
            'canCreateSales': ['pos'],
            'canViewReports': ['movements'],
            'canManageUsers': ['settings']
        };

        const userPermissions = req.user.permissions || {};

        // Un administrador tiene todos los permisos
        if (req.user.role === 'admin') {
            return next();
        }

        // Verificar el permiso directo
        if (userPermissions[permission]) {
            return next();
        }

        // Verificar si tiene el permiso maestro
        const masters = masterPermMap[permission];
        if (masters && masters.some(master => userPermissions[master])) {
            return next();
        }

        res.status(403).json({
            success: false,
            message: 'No tienes permiso para realizar esta acción'
        });
    };
};

const isAdmin = (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({
        success: false,
        message: 'Se requieren permisos de administrador'
    });
};

module.exports = { auth, checkPermission, isAdmin };
