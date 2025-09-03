// backend/src/routes/invites.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';

const prisma = new PrismaClient();
const router = express.Router();

function isAdmin(req) {
    // в requireAuth ми вже кладемо req.user; але дублюємо перевірку на випадок відсутності
    if (req?.user?.isAdmin === true) return true;
    try {
        const h = req.headers.authorization || '';
        const t = h.startsWith('Bearer ') ? h.slice(7) : '';
        if (!t) return false;
        const p = jwt.verify(t, config.jwtSecret);
        return p?.isAdmin === true;
    } catch {
        return false;
    }
}

function ttlMinutesFrom(req) {
    const m = Number(req.body?.minutes);
    if (!Number.isFinite(m) || m <= 0) return null;
    return Math.floor(m);
}

function genCode() {
    // короткий читабельний код
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ---------- GET /api/invites (admin) ----------
router.get('/invites', requireAuth, async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ status: 'error', message: 'Лише для адміна' });
    const rows = await prisma.invite.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(rows);
});

// ---------- POST /api/invites (admin) body: { minutes?: number } ----------
router.post('/invites', requireAuth, async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ status: 'error', message: 'Лише для адміна' });
    const minutes = ttlMinutesFrom(req);
    const expiresAt = minutes ? new Date(Date.now() + minutes * 60000) : null;

    const row = await prisma.invite.create({
        data: { code: genCode(), expiresAt },
    });

    try {
        const { logger } = await import('../logger.js');
        logger.info('Invite created', { reqId: req.id, inviteId: row.id, expiresAt });
    } catch {}

    res.status(201).json(row);
});

// ---------- DELETE /api/invites/:key (admin) — key = id або code ----------
router.delete('/invites/:key', requireAuth, async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ status: 'error', message: 'Лише для адміна' });
    const key = String(req.params.key);
    const row = await prisma.invite.findFirst({
        where: { OR: [{ id: key }, { code: key }] },
    });
    if (!row) return res.status(404).json({ status: 'error', message: 'Не знайдено' });

    await prisma.invite.delete({ where: { id: row.id } });

    try {
        const { logger } = await import('../logger.js');
        logger.info('Invite deleted', { reqId: req.id, inviteId: row.id, code: row.code });
    } catch {}

    res.status(204).end();
});

export default router;
