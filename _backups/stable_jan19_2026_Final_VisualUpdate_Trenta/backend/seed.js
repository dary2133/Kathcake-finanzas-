const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

dotenv.config();

const seed = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI is not defined in environment variables');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const admins = [
            {
                name: 'Dary',
                email: 'dary.2133@hotmail.com',
                password: '@Rlet172624',
                role: 'admin'
            }
        ];

        for (const adminData of admins) {
            const existingUser = await User.findOne({ email: adminData.email });
            if (existingUser) {
                console.log(`ℹ️ Admin user ${adminData.email} already exists`);
            } else {
                const user = new User({
                    ...adminData,
                    permissions: {
                        canCreateProducts: true,
                        canEditProducts: true,
                        canDeleteProducts: true,
                        canCreateSales: true,
                        canViewReports: true,
                        canManageUsers: true,
                        canManageInventory: true
                    }
                });
                await user.save();
                console.log(`✨ Admin user ${adminData.email} created successfully`);
            }
        }

        console.log('🚀 Seeding completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    }
};

seed();
