const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { auth, checkPermission } = require('../middleware/auth');

// Carga segura de librerías de imágenes y multer
let CloudinaryStorage, cloudinary, multer;
try {
    multer = require('multer');
} catch (e) {
    console.warn('MULTER failed to load:', e.message);
}

try {
    cloudinary = require('cloudinary').v2;
} catch (e) {
    console.warn('CLOUDINARY failed to load:', e.message);
}

try {
    CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;
} catch (e) {
    console.warn('MULTER-STORAGE-CLOUDINARY failed to load:', e.message);
}

// Asegurar configuración de Cloudinary
if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}



// Configuración de Multer segura (No rompe si no hay multer)
const storage = multer ? multer.memoryStorage() : null;
const upload = multer ? multer({
    storage: storage,
    limits: { fileSize: 4.5 * 1024 * 1024 } // 4.5MB límite duro
}) : { single: () => (req, res, next) => next(), array: () => (req, res, next) => next() };

// Helper para subir a Cloudinary manualmente
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'katcake-products',
                transformation: [{ width: 800, height: 600, crop: 'limit' }]
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

// Obtener todos los productos
router.get('/', auth, async (req, res) => {
    try {
        const {
            category,
            search,
            page = 1,
            limit = 20,
            inStock,
            active = 'true'
        } = req.query;

        const where = {
            isActive: active === 'true'
        };

        if (category) where.category = category;
        if (inStock === 'true') where.stock = { gt: 0 };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            include: {
                categoryData: true,
                createdBy: {
                    select: { name: true, email: true }
                }
            }
        });

        const mappedProducts = products.map(p => ({ ...p, _id: p.id }));

        const total = await prisma.product.count({ where });

        res.json({
            success: true,
            data: mappedProducts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / take),
                limit: take
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Crear producto con subida manual
router.post('/', auth, checkPermission('canCreateProducts'), upload.single('image'), async (req, res) => {
    try {
        // Verificar entorno aquí - PERO NO FALLAR COMPLETAMENTE SI SOLO FALTA IMAGEN
        // Solo fallar si intenta subir imagen

        if (!req.body.data) {
            console.error('Missing req.body.data. Body received:', req.body);
            return res.status(400).json({ success: false, message: 'Datos del producto no recibidos' });
        }

        let productDataRaw;
        try {
            productDataRaw = JSON.parse(req.body.data);
        } catch (e) {
            console.error('JSON Parse error:', e);
            return res.status(400).json({ success: false, message: 'Formato de datos inválido' });
        }

        if (!productDataRaw.name) return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio' });
        if (productDataRaw.price === undefined || productDataRaw.price === null || productDataRaw.price === "") return res.status(400).json({ success: false, message: 'El precio es obligatorio' });

        const productData = {
            name: productDataRaw.name,
            description: productDataRaw.description || '',
            category: productDataRaw.category || 'general',
            categoryId: productDataRaw.categoryId || null,
            price: parseFloat(productDataRaw.price),
            cost: parseFloat(productDataRaw.cost || 0),
            stock: parseInt(productDataRaw.stock || 0),
            minStock: parseInt(productDataRaw.minStock || 5),
            preparationTime: productDataRaw.preparationTime ? parseInt(productDataRaw.preparationTime) : 0,
            hasVariants: !!productDataRaw.hasVariants,
            isActive: productDataRaw.isActive !== undefined ? !!productDataRaw.isActive : true,
            tags: Array.isArray(productDataRaw.tags) ? productDataRaw.tags : [],
            ingredients: productDataRaw.ingredients || [],
            variants: productDataRaw.variants || [],
            createdById: (req.user && req.user.id && !req.user.id.startsWith('admin-')) ? req.user.id : null
        };

        // Manejar subida MANUAL si existe imagen o Base64
        if (productDataRaw.imageBase64) {
            productData.images = [{
                url: productDataRaw.imageBase64,
                publicId: `b64-${Date.now()}`,
                isMain: true
            }];
        } else if (req.file) {
            // INTENTO DE SUBIDA: Si falla por configuración, NO bloquear todo el proceso.
            if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'tu_cloud_name') {
                console.warn('ADVERTENCIA: Cloudinary no configurado. Se guardará sin imagen en nube.');
            } else {
                try {
                    const result = await uploadToCloudinary(req.file.buffer);
                    productData.images = [{
                        url: result.secure_url,
                        publicId: result.public_id,
                        isMain: true
                    }];
                } catch (uErr) {
                    console.error('Error Cloudinary Upload (Ignorado):', uErr);
                }
            }
        } else if (productDataRaw.images) {
            productData.images = productDataRaw.images;
        }

        const product = await prisma.product.create({
            data: productData,
            include: { categoryData: true }
        });

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: { ...product, _id: product.id }
        });
    } catch (error) {
        console.error('Database/Handler Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno al guardar producto'
        });
    }
});

// Actualizar producto
router.put('/:id', auth, checkPermission('canEditProducts'), upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const productDataRaw = JSON.parse(req.body.data || '{}');

        const productData = {
            name: productDataRaw.name,
            description: productDataRaw.description,
            category: productDataRaw.category,
            categoryId: productDataRaw.categoryId || null,
            price: parseFloat(productDataRaw.price),
            cost: productDataRaw.cost ? parseFloat(productDataRaw.cost) : undefined,
            stock: parseInt(productDataRaw.stock) || 0,
            minStock: parseInt(productDataRaw.minStock) || 5,
            preparationTime: productDataRaw.preparationTime ? parseInt(productDataRaw.preparationTime) : undefined,
            hasVariants: !!productDataRaw.hasVariants,
            isActive: productDataRaw.isActive !== undefined ? !!productDataRaw.isActive : true,
            tags: productDataRaw.tags || [],
            ingredients: productDataRaw.ingredients || [],
            variants: productDataRaw.variants || []
        };

        if (productDataRaw.imageBase64) {
            productData.images = [{
                url: productDataRaw.imageBase64,
                publicId: `b64-${Date.now()}`,
                isMain: true
            }];
        } else if (req.file) {
            // Check for valid config before attempting (optional, but good for logging)
            if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'tu_cloud_name') {
                console.warn('ADVERTENCIA: Cloudinary no configurado (PUT). Se guardará sin actualizar imagen.');
            } else {
                try {
                    const result = await uploadToCloudinary(req.file.buffer);
                    productData.images = [{
                        url: result.secure_url,
                        publicId: result.public_id,
                        isMain: true
                    }];
                } catch (uErr) {
                    console.error('Error Cloudinary Upload en PUT (Ignorado):', uErr);
                }
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: productData,
            include: { categoryData: true }
        });

        res.json({
            success: true,
            message: 'Producto actualizado',
            data: { ...product, _id: product.id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar producto
router.delete('/:id', auth, checkPermission('canDeleteProducts'), async (req, res) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Buscar productos rápidamente (para POS)
router.get('/search/quick', auth, async (req, res) => {
    try {
        const { q, category } = req.query;

        const where = {
            isActive: true,
            stock: { gt: 0 }
        };

        if (category) {
            where.category = { equals: category, mode: 'insensitive' };
        }

        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { tags: { has: q } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            take: 20,
            select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                images: true,
                category: true,
                categoryId: true,
                categoryData: true,
                variants: true
            }
        });

        const mappedProducts = products.map(p => ({ ...p, _id: p.id }));

        res.json({
            success: true,
            data: mappedProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
