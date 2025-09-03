import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const users = await prisma.user.findMany({ where: { email: null } });
    for (const u of users) {
        const placeholder = `placeholder+${u.id.slice(0, 8)}@local`;
        await prisma.user.update({
            where: { id: u.id },
            data: { email: placeholder },
        });
        console.log(`Filled email for user ${u.id}: ${placeholder}`);
    }
}

run()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
