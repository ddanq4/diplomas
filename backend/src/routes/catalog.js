import { Router } from 'express';
import { FACULTIES } from '../data/catalog.js';

export const catalog = Router();


catalog.get('/', (_req, res) => res.json(FACULTIES));

catalog.get('/list', (_req, res) => {
    const list = Object.entries(FACULTIES).map(([key, f]) => ({
        key, name: f.name, specialties: f.specialties
    }));
    res.json(list);
});
