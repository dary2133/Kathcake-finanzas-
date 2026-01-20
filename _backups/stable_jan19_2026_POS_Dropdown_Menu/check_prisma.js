const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const productCount = await prisma.product.count();
        console.log('Total Products:', productCount);

        const userCount = await prisma.user.count();
        console.log('Total Users:', userCount);

        const salesCount = await prisma.sale.count();
        console.log('Total Sales:', salesCount);

        if (productCount > 0) {
            const products = await prisma.product.findMany({ take: 5 });
            console.log('Sample Products:', products.map(p => p.name));
        }
    } catch (e) {
        console.error('Error connecting to Prisma:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
