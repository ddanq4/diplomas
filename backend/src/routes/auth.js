// backend/src/routes/auth.js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

const JWT = process.env.JWT_SECRET || 'dev_secret_replace_me';
const TOKEN_TTL = process.env.JWT_TTL || '7d';
const ALLOW_SELF_REGISTER = (/^(1|true|yes)$/i).test(process.env.ALLOW_SELF_REGISTER || '');

function signToken(user) {
  return jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin === true },
      JWT,
      { expiresIn: TOKEN_TTL }
  );
}

// POST /api/login
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ status: 'error', message: 'Email та пароль обовʼязкові' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ status: 'error', message: 'Невірний email або пароль' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ status: 'error', message: 'Невірний email або пароль' });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin === true } });
  } catch (e) { next(e); }
});

// POST /api/register
router.post('/register', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const inviteCode = String(req.body?.inviteCode || '').trim();
    if (!email || !password) return res.status(400).json({ status: 'error', message: 'Email та пароль обовʼязкові' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ status: 'error', message: 'Користувач вже існує' });

    const usersCount = await prisma.user.count();
    let isAdmin = false;

    if (usersCount === 0) {
      isAdmin = true; // перший користувач — адмін
    } else if (ALLOW_SELF_REGISTER) {
      isAdmin = false;
    } else {
      if (!inviteCode) return res.status(400).json({ status: 'error', message: 'Потрібен код інвайту' });
      const now = new Date();
      const invite = await prisma.invite.findUnique({ where: { code: inviteCode } });
      const valid = invite && !invite.revokedAt && !invite.usedAt && (!invite.expiresAt || invite.expiresAt > now);
      if (!valid) return res.status(400).json({ status: 'error', message: 'Недійсний або використаний інвайт' });
      isAdmin = true;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, isAdmin } });

    if (usersCount > 0 && !ALLOW_SELF_REGISTER && inviteCode) {
      await prisma.invite.update({
        where: { code: inviteCode },
        data: { usedAt: new Date(), usedById: user.id }
      });
    }

    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin === true } });
  } catch (e) { next(e); }
});

// GET /api/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const row = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!row) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    return res.json({ user: { id: row.id, email: row.email, isAdmin: row.isAdmin === true } });
  } catch (e) { next(e); }
});

export default router;
