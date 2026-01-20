const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');

const auth = async (req, res, next) => {
    try {
        // Buscar el token en múltiples lugares por compatibilidad
        const authHeader = req.header('Authorization') || req.header('authorization') || req.header('x-access-token');
        const token = authHeader?.replace('Bearer ', '') || req.query.token;

        if (!token) {
            console.error('AUTH ERROR: No token provided. Headers received:', JSON.stringify(req.headers));
            return res.status(401).json({ success: false, message: 'Token no proporcionado o incompleto' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || '@KathCake_POS_2026_Secure_Fallback_Key');
        } catch (e) {
            return res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
        }

        // Si es un admin de emergencia o sincronizado, saltamos validación pesada de DB
        if (decoded.userId === 'admin-1' || decoded.role === 'admin') {
            req.user = {
                id: decoded.userId,
                role: 'admin',
                permissions: decoded.permissions || { all: true }
            };
            req.token = token;
            return next();
        }

        // Búsqueda en DB para usuarios normales
        let user = null;
        try {
            if (prisma) {
                user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            }
        } catch (dbErr) {
            console.error('Auth Middleware DB Error:', dbErr.message);
        }

        if (!user || !user.isActive) {
            // Si el user es admin en el token, lo dejamos pasar aunque falle la DB
            if (decoded.role === 'admin') {
                req.user = { id: decoded.userId, role: 'admin', permissions: { all: true } };
                return next();
            }
            throw new Error('Usuario no encontrado');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Autenticación fallida' });
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
