import 'dotenv/config';
import app from './app.js';
import { PrismaClient } from '@prisma/client';

const port = process.env.PORT || 5000;

async function start() {
  const dbUrl = process.env.DATABASE_URL;
  console.log(`[BOOT] DATABASE_URL=${dbUrl || '(empty)'}`);

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    let host = 'unknown', db = 'unknown', p = 'unknown';
    if (dbUrl) {
      try {
        const u = new URL(dbUrl);
        host = u.hostname;
        p = u.port || '5432';
        db = u.pathname.replace(/^\//, '');
      } catch { /* ignore */ }
    }
    console.log(`[DB] OK → ${host}:${p}/${db}`);
  } catch (e) {
    console.error('[DB] FAILED →', e.message);
  }

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

start().catch((e) => {
  console.error('[BOOT] fatal:', e);
});
