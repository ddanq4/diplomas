import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './setup.js';

beforeAll(async () => {
    await resetDb();
});

describe('Auth API', () => {
    it('POST /api/login з неправильними даними → 401', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ email: 'no@user.com', password: 'bad' });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('status', 'error');
    });
});
