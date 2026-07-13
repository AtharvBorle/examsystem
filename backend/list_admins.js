const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.admin.findMany();
    console.log(`Total Admins in DB: ${admins.length}`);
    for (const a of admins) {
        console.log(`Admin: ID=${a.id}, Email=${a.email}, Name=${a.name}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
