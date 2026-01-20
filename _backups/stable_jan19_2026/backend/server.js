const express = require('express');
const mongoose = require('mongoose'); // Re-enabled
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Configuración
dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Conectar a MongoDB (Legacy support restored)
// Conectar a MongoDB (Legacy support - OPTIONAL)
// En Vercel, si no hay MONGODB_URI, esto podría causar timeout si no se maneja
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.warn('⚠️ MongoDB connection skipped:', err.message));
} else {
  console.log('ℹ️ MongoDB start skipped (No URI provided)');
}

// Configurar Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const saleRoutes = require('./src/routes/sale.routes');
const movementRoutes = require('./src/routes/movement.routes');
const categoryRoutes = require('./src/routes/category.routes');
const userRoutes = require('./src/routes/user.routes');
const settingRoutes = require('./src/routes/setting.routes');
const cashRegisterRoutes = require('./src/routes/cash-register.routes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/cash-register', cashRegisterRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sistema POS KatCake Pops funcionando',
    version: '1.0.0'
  });
});

// Servir archivos estáticos en producción - DESHABILITADO EN VERCEL (Manejado por vercel.json)
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../frontend/dist')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
//   });
// }

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Algo salió mal en el servidor'
  });
});

// Puerto - Solo escuchar si se ejecuta directamente
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
