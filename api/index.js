const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Importar componentes usando rutas relativas directas
// Vercel agrupará estos archivos al desplegar
const prisma = require('../backend/src/db/prisma');
const authRoutes = require('../backend/src/routes/auth.routes');
const productRoutes = require('../backend/src/routes/product.routes');
const saleRoutes = require('../backend/src/routes/sale.routes');
const userRoutes = require('../backend/src/routes/user.routes');

// Registro de rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);

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

// Captura de errores de última instancia
app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        details: err.message
    });
});

module.exports = app;
