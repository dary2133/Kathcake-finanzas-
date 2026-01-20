/**
 * Singleton de Prisma Client para evitar múltiples conexiones en Vercel
 */
let prisma = null;

try {
    const { PrismaClient } = require('@prisma/client');
    if (process.env.NODE_ENV === 'production') {
        prisma = new PrismaClient();
    } else {
        if (!global.prisma) {
            global.prisma = new PrismaClient();
        }
        prisma = global.prisma;
    }
    console.log('✅ Prisma Client initialized');
} catch (error) {
    console.warn('⚠️ CRITICAL: Prisma Client could not be initialized:', error.message);
    // No lanzamos error para que el resto de la app cargue (Safe Mode)
}

module.exports = prisma;
