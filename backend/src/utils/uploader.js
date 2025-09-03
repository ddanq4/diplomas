// backend/src/utils/uploader.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.cwd(), 'backend/uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Берём лимит из ENV; поддерживаем несколько имён переменных.
// По умолчанию 10 МБ.
const MAX_FILE_MB = (() => {
  const raw = Number(
      process.env.UPLOAD_MAX_MB ??
      process.env.MAX_FILE_MB ??
      process.env.FILE_MAX_MB ??
      10
  );
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 10;
})();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const ALLOWED_MIME = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  return cb(new Error('Дозволені лише PDF, PNG, JPG'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
});

// Экспортируем, чтобы показывать лимит в ошибках
export const getUploadLimitMb = () => MAX_FILE_MB;
