const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // Permite que varios usuarios no tengan email
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'cashier', 'baker', 'seller'],
        default: 'seller'
    },
    phone: {
        type: String,
        unique: true,
        sparse: true, // Permite que varios usuarios no tengan teléfono (aunque lo usaremos para login)
        trim: true
    },
    address: String,
    profileImage: {
        type: String,
        default: 'https://res.cloudinary.com/demo/image/upload/v1631649123/default-avatar.png'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    permissions: {
        canCreateProducts: { type: Boolean, default: false },
        canEditProducts: { type: Boolean, default: false },
        canDeleteProducts: { type: Boolean, default: false },
        canCreateSales: { type: Boolean, default: true },
        canViewReports: { type: Boolean, default: false },
        canManageUsers: { type: Boolean, default: false },
        canManageInventory: { type: Boolean, default: false }
    },
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encriptar contraseña
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
