import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

export async function resetDb() {
    await prisma.invite.deleteMany();
    await prisma.diploma.deleteMany();
    await prisma.user.deleteMany();
}

afterAll(async () => {
    await prisma.$disconnect();
});
