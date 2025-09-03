import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './setup.js';

beforeAll(async () => {
    await resetDb();
});

afterAll(async () => {
    await resetDb();
});

describe('Diplomas API', () => {
    it('GET /api/diplomas → 200 + пустий список', async () => {
        const res = await request(app).get('/api/diplomas');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('items');
        expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('POST /api/diplomas без токена → 401', async () => {
        const res = await request(app)
            .post('/api/diplomas')
            .field('studentName', 'Тест')
            .field('year', 2023)
            .field('diplomaNumber', '№123');
        expect(res.statusCode).toBe(401);
    });
});
