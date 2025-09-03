import { Prisma } from '@prisma/client';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target) ? err.meta.target : [];
    const msg = 'Диплом з таким номером і роком вже існує';
    const errors = {};
    if (fields.includes('diplomaNumber') || fields.includes('year')) {
      errors.diplomaNumber = 'Номер + рік мають бути унікальні';
      errors.year = 'Номер + рік мають бути унікальні';
    }
    return res.status(409).json({ message: msg, errors });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    const mb = Math.round((err.limit || 10 * 1024 * 1024) / 1024 / 1024);
    return res.status(400).json({ message: `Файл завеликий (>${mb} МБ)`, errors: { file: 'Завеликий розмір' } });
  }
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ message: 'Дозволені тільки PDF, JPG, PNG', errors: { file: 'Неприпустимий тип' } });
  }
  // твоя стандартная ветка:
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error', errors: err.errors });
}