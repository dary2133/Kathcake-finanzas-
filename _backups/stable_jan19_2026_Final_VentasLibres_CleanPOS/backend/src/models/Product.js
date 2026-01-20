const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    category: {
        type: String,
        enum: ['cake-pops', 'pasteles', 'cupcakes', 'galletas', 'postres', 'bebidas', 'personalizados'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    cost: {
        type: Number,
        min: 0
    },
    images: [{
        url: String,
        publicId: String,
        isMain: { type: Boolean, default: false }
    }],
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    minStock: {
        type: Number,
        default: 5
    },
    ingredients: [{
        name: String,
        quantity: Number,
        unit: String
    }],
    preparationTime: Number,
    hasVariants: {
        type: Boolean,
        default: false
    },
    variants: [{
        name: String,
        price: Number,
        stock: Number
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [String],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índices
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
