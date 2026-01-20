const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkData() {
    try {
        if (!process.env.MONGODB_URI) {
            console.log('No MONGODB_URI found in .env');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error checking MongoDB:', err.message);
    }
}

checkData();
