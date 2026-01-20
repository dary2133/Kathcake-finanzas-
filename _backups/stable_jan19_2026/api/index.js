const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const jwt = require('jsonwebtoken'); // FORZAR CARGA PARA VERCEL
const app = express();

app.use(cors());
app.use(express.json());

// Importar componentes usando rutas relativas directas
// Vercel agrupará estos archivos al desplegar
const prisma = require('../backend/src/db/prisma');
// Registro de rutas con captura de errores de importación individual
const routesToLoad = [
    { path: 'auth', file: '../backend/src/routes/auth.routes' },
    { path: 'products', file: '../backend/src/routes/product.routes' },
    { path: 'sales', file: '../backend/src/routes/sale.routes' },
    { path: 'users', file: '../backend/src/routes/user.routes' },
    { path: 'movements', file: '../backend/src/routes/movement.routes' },
    { path: 'categories', file: '../backend/src/routes/category.routes' },
    { path: 'settings', file: '../backend/src/routes/setting.routes' },
    { path: 'cash-register', file: '../backend/src/routes/cash-register.routes' }
];

routesToLoad.forEach(route => {
    try {
        const routeModule = require(route.file);
        app.use(`/api/${route.path}`, routeModule);
    } catch (err) {
        console.error(`ERROR LOADING ROUTE [${route.path}]:`, err);
        app.use(`/api/${route.path}`, (req, res) => {
            res.status(500).json({
                success: false,
                message: `RUTA [${route.path}] ERROR: ${err.message}`, // Exponemos el error real aquí
                error: err.message,
                stack: err.stack
            });
        });
    }
});

app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ONLINE',
            database: 'Connected 🟢',
            message: 'Kathcake POS is ready 🚀'
        });
    } catch (err) {
        res.json({
            status: 'ERROR',
            database: 'Disconnected 🔴',
            error: err.message
        });
    }
});

app.get('/api/db-test', async (req, res) => {
    const results = {
        env_has_db_url: !!process.env.DATABASE_URL,
        prisma_is_null: prisma === null,
        node_env: process.env.NODE_ENV,
        error: null,
        query_result: null
    };

    try {
        if (!prisma) throw new Error("Prisma client is null");
        const userCount = await prisma.user.count();
        const productCount = await prisma.product.count();
        const saleCount = await prisma.sale.count();

        results.query_result = {
            users: userCount,
            products: productCount,
            sales: saleCount
        };
        results.status = "SUCCESS";
    } catch (err) {
        results.error = err.message;
        results.status = "FAILED";
        results.stack = err.stack;
    }

    res.json(results);
});

app.get('/api/debug-env', (req, res) => {
    res.json({
        node_env: process.env.NODE_ENV,
        has_db_url: !!process.env.DATABASE_URL,
        db_url_prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 10) + '...' : 'N/A',
        prisma_version: require('prisma/package.json').version,
        client_version: require('@prisma/client/package.json').version
    });
});

// Captura de errores de última instancia
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR HANDLER:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error (Captured)',
        details: err.message,
        stack: err.stack
    });
});

module.exports = app;
