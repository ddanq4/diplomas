import { randomUUID } from 'crypto';

export function attachReqId(req, _res, next) {
    req.id = req.id || randomUUID();
    next();
}
