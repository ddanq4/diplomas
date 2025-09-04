// backend/src/routes/diplomas.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

export const router = express.Router();
const prisma = new PrismaClient();

/* ========================= Директория для файлов ========================= */
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/* ========================= Лимиты из .env ========================= */
const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 10);
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_EXT  = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

/* ========================= Multer (multipart) ========================= */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const ok = ALLOWED_MIME.has((file.mimetype || '').toLowerCase()) && ALLOWED_EXT.has(ext);
    cb(ok ? null : new Error('INVALID_FILE_TYPE'));
  },
});
// принимаем любые поля-файлы (не только "file")
const acceptAnyFiles = upload.any();

/* ========================= Утилиты ========================= */
const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';
const intOr = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const idStr = (v) => String(v ?? '').trim();

const normSpec = (s) => {
  if (typeof s === 'string') return { key: s, label: s };
  const key = s?.key || s?.name || s?.code || String(s);
  const label = s?.label || s?.name || s?.code || key;
  return { key, label };
};

const safeName = (name) => {
  const ext = (path.extname(name || '') || '').toLowerCase();
  const base = path.basename(name || 'file', ext).replace(/\s+/g, '_');
  return `${Date.now()}_${base}${ext}`;
};
const okType = (name, mime) =>
    ALLOWED_EXT.has((path.extname(name || '') || '').toLowerCase()) &&
    ALLOWED_MIME.has(String(mime || '').toLowerCase());

/** Принять файл из multer/express-fileupload (multipart). Вернёт web-путь /uploads/... */
function validateAndStoreFileFromAnySource(req) {
  // 1) Multer — файл уже на диске и провалидирован
  if (req.file?.filename) return `/uploads/${req.file.filename}`;
  if (Array.isArray(req.files) && req.files[0]?.filename) return `/uploads/${req.files[0].filename}`;

  // 2) express-fileupload (req.files — объект)
  if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
    const keys = Object.keys(req.files);
    if (!keys.length) return null;

    let f = req.files[keys[0]];
    if (Array.isArray(f)) f = f[0];

    const name = f?.name || 'upload';
    const mime = (f?.mimetype || '').toLowerCase();

    // размер (возможные поля)
    let size = Number(f?.size || 0);
    if (!size && f?.tempFilePath) {
      try { size = fs.statSync(f.tempFilePath).size; } catch {}
    } else if (!size && f?.data && Buffer.isBuffer(f.data)) {
      size = f.data.length;
    }

    if (!okType(name, mime)) { const e = new Error('INVALID_FILE_TYPE'); e.code = 'INVALID_FILE_TYPE'; throw e; }
    if (size > MAX_FILE_BYTES) { const e = new Error('FILE_TOO_LARGE'); e.code = 'FILE_TOO_LARGE'; throw e; }

    const filename = safeName(name);
    const dst = path.join(uploadDir, filename);

    if (f?.tempFilePath) fs.renameSync(f.tempFilePath, dst);
    else if (f?.data && Buffer.isBuffer(f.data)) fs.writeFileSync(dst, f.data);
    else if (typeof f?.mv === 'function') f.mv(dst);
    else { const e = new Error('FILE_SAVE_FAILED'); e.code = 'FILE_SAVE_FAILED'; throw e; }

    return `/uploads/${filename}`;
  }
  return null;
}

/** Бэкап: принять файл из base64 (dataURL или чистая base64) в JSON-теле запроса */
function validateAndStoreBase64FromBody(req) {
  const b64raw = req.body?.fileBase64 || req.body?.file || null;
  if (!b64raw) return null;

  let data = b64raw;
  let mime = (req.body?.fileType || '').toLowerCase();
  const m = /^data:([^;]+);base64,(.*)$/.exec(b64raw);
  if (m) { mime = m[1].toLowerCase(); data = m[2]; }

  const buf = Buffer.from(data, 'base64');
  if (buf.length === 0) return null;

  const nameHint = req.body?.fileName || 'upload';
  let ext = (path.extname(nameHint || '') || '').toLowerCase();
  if (!ext) {
    if (mime === 'image/jpeg') ext = '.jpg';
    else if (mime === 'image/png') ext = '.png';
    else if (mime === 'application/pdf') ext = '.pdf';
  }
  const finalName = `${path.basename(nameHint, path.extname(nameHint)) || 'file'}${ext || ''}`;

  if (!okType(finalName, mime)) { const e = new Error('INVALID_FILE_TYPE'); e.code = 'INVALID_FILE_TYPE'; throw e; }
  if (buf.length > MAX_FILE_BYTES) { const e = new Error('FILE_TOO_LARGE'); e.code = 'FILE_TOO_LARGE'; throw e; }

  const filename = safeName(finalName);
  fs.writeFileSync(path.join(uploadDir, filename), buf);
  return `/uploads/${filename}`;
}

/* ========================= Загрузка каталога FACULTIES ========================= */
let FACULTIES = {};
async function loadCatalog() {
  const tryPaths = [
    '../data/catalog.js',
    '../data/faculties.js',
    '../const/catalog.js',
    '../const/faculties.js',
  ];
  for (const p of tryPaths) {
    try {
      const mod = await import(p);
      const obj = mod?.FACULTIES || mod?.default || mod;
      if (obj && typeof obj === 'object' && Object.keys(obj).length) {
        FACULTIES = obj;
        console.log('[CATALOG] Loaded from', p, '→', Object.keys(FACULTIES).length, 'faculties');
        return;
      }
    } catch (_e) {}
  }
  console.warn('[CATALOG] FAILED to load catalog. FACULTIES is empty!');
}
await loadCatalog();

/* ===== helper: найти факультет по ключу спеціальності ===== */
function facultyBySpecialty(specKey) {
  const k = String(specKey || '').trim();
  if (!k) return null;
  for (const [facKey, f] of Object.entries(FACULTIES)) {
    const list = (f?.specialties || []).map(normSpec);
    if (list.some(s => s.key === k)) {
      return { key: facKey, name: f?.name || facKey };
    }
  }
  return null;
}

/* =============================================================================
   FILTERS / FACULTIES (ВАЖНО: идут раньше /diplomas/:id)
============================================================================= */

router.get('/diplomas/filters', async (_req, res, next) => {
  try {
    const entries = Object.entries(FACULTIES).map(([facKey, f]) => {
      const name = f?.name || facKey;
      const specs = (f?.specialties || []).map(normSpec);
      return { facKey, name, specs };
    });

    const facultiesOptions = entries.map(e => ({ key: e.facKey, name: e.name }));
    const specialtyOptionsByFacultyKey = Object.fromEntries(entries.map(e => [e.facKey, e.specs]));
    const faculties = entries.map(e => e.name); // legacy
    const specialties = Array.from(new Set(entries.flatMap(e => e.specs.map(s => s.key))));
    const specialtiesByFacultyName = Object.fromEntries(entries.map(e => [e.name, e.specs.map(s => s.label)]));
    const specialtiesByFacultyKey = Object.fromEntries(entries.map(e => [e.facKey, e.specs.map(s => s.key)]));

    res.json({
      faculties, specialties, facultiesOptions,
      specialtiesByFacultyName, specialtiesByFacultyKey, specialtyOptionsByFacultyKey,
      scopes: ['verified', 'unverified', 'all'],
      sorts: ['createdAt', 'year', 'studentName', 'diplomaNumber'],
      dirs: ['asc', 'desc'],
    });
  } catch (e) { next(e); }
});

router.get('/diplomas/faculties', async (_req, res, next) => {
  try {
    const counters = await prisma.diploma.groupBy({
      by: ['specialty'],
      _count: { specialty: true },
      where: { isVerified: true },
    }).catch(() => []);
    const map = new Map(counters.map(r => [String(r.specialty || ''), r._count.specialty]));

    const faculties = Object.entries(FACULTIES).map(([facKey, f]) => {
      const name = f?.name || facKey;
      const specs = (f?.specialties || []).map(normSpec).map(({ key, label }) => ({
        key, name: label, label, count: map.get(key) || 0,
      }));
      return { faculty: facKey, title: name, name, specialties: specs, count: specs.reduce((s, x) => s + x.count, 0) };
    });

    res.json({ faculties });
  } catch (e) { next(e); }
});

/* =============================================================================
   CRUD
============================================================================= */

// LIST
router.get('/diplomas', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q = '', year, faculty, specialty, is_verified, sort = 'createdAt', dir = 'desc' } = req.query;

    const where = {};
    if (q) {
      where.OR = [
        { studentName: { contains: String(q), mode: 'insensitive' } },
        { diplomaNumber: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    if (year) where.year = intOr(year, undefined);
    if (typeof is_verified !== 'undefined') where.isVerified = toBool(is_verified);

    if (specialty) where.specialty = String(specialty);
    else if (faculty) {
      const fac = FACULTIES[faculty] ||
          Object.values(FACULTIES).find(v => (v?.name || '').toLowerCase() === String(faculty).toLowerCase());
      if (fac) where.specialty = { in: (fac.specialties || []).map(normSpec).map(x => x.key) };
    }

    const validSorts = ['createdAt', 'year', 'studentName', 'diplomaNumber'];
    const orderBy = { [validSorts.includes(String(sort)) ? String(sort) : 'createdAt']: (String(dir).toLowerCase() === 'asc' ? 'asc' : 'desc') };
    const take = intOr(limit, 20);
    const skip = (intOr(page, 1) - 1) * take;

    const [rows, total] = await Promise.all([
      prisma.diploma.findMany({ where, orderBy, take, skip }),
      prisma.diploma.count({ where }),
    ]);

    const enriched = rows.map(r => {
      const fac = facultyBySpecialty(r.specialty);
      return { ...r, facultyKey: fac?.key || null, facultyName: fac?.name || null };
    });
    res.json({ rows: enriched, total, page: intOr(page, 1), limit: take });
  } catch (e) { next(e); }
});

// DETAIL
router.get('/diplomas/:id', async (req, res, next) => {
  try {
    const id = idStr(req.params.id);
    if (!id || id === 'undefined' || id === 'null') return res.status(400).json({ message: 'Invalid id' });
    const row = await prisma.diploma.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ message: 'Not found' });

    const fac = facultyBySpecialty(row.specialty);
    const out = { ...row, facultyKey: fac?.key || null, facultyName: fac?.name || null };
    res.json(out);
  } catch (e) { next(e); }
});

// GET /api/diplomas/:id/file
router.get('/diplomas/:id/file', async (req, res, next) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    // 1) сначала пытаемся отдать файл по фиксированному имени /uploads/<id>.(pdf|jpg|jpeg|png)
    const candidates = ['.pdf', '.jpg', '.jpeg', '.png']
        .map(ext => path.join(process.cwd(), 'uploads', `${id}${ext}`));
    for (const abs of candidates) {
      if (fs.existsSync(abs)) {
        res.set('Cache-Control', 'no-store, max-age=0');
        // на всякий лог, чтобы увидеть какой путь реально отдали
        console.log('[GET diplomas:file] serve fixed', abs);
        return res.sendFile(abs);
      }
    }

    // 2) если фиксированного файла нет — используем путь из БД (обратная совместимость)
    const row = await prisma.diploma.findUnique({ where: { id } });
    if (!row?.fileUrl) return res.status(404).json({ message: 'Not Found' });

    const rel = String(row.fileUrl).replace(/^\/+/, '');
    const fileRel = rel.startsWith('uploads') ? rel : path.join('uploads', rel);
    const abs = path.resolve(process.cwd(), fileRel);
    if (!fs.existsSync(abs)) return res.status(404).json({ message: 'Not Found' });

    res.set('Cache-Control', 'no-store, max-age=0');
    console.log('[GET diplomas:file] serve db', abs);
    return res.sendFile(abs);
  } catch (e) { next(e); }
});


// CREATE
router.post('/diplomas', acceptAnyFiles, async (req, res, next) => {
  try {
    const { studentName, specialty, year, diplomaNumber } = req.body;
    if (!studentName || !specialty || !year || !diplomaNumber) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    let fileUrl = validateAndStoreFileFromAnySource(req);
    if (!fileUrl) fileUrl = validateAndStoreBase64FromBody(req);
    if (!fileUrl) return res.status(400).json({ message: 'File is required' });

    const specKey = String(specialty).trim();
    const known = Object.values(FACULTIES).some(fac =>
        (fac.specialties || []).map(normSpec).some(s => s.key === specKey)
    );
    if (!known) return res.status(400).json({ message: 'Unknown specialty (not in catalog)' });

    const rec = await prisma.diploma.create({
      data: {
        studentName: String(studentName),
        specialty: specKey,
        year: intOr(year, null),
        diplomaNumber: String(diplomaNumber),
        fileUrl,
        isVerified: false,
      },
    });
    res.status(201).json(rec);
  } catch (e) {
    const code = e?.code || e?.message || '';
    if (code.includes('INVALID_FILE_TYPE')) return res.status(400).json({ message: 'INVALID_FILE_TYPE' });
    if (code.includes('FILE_TOO_LARGE'))   return res.status(400).json({ message: 'FILE_TOO_LARGE' });
    next(e);
  }
});

// UPDATE — надежный, с логами и любым источником файла
router.patch('/diplomas/:id', acceptAnyFiles, async (req, res, next) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    const existing = await prisma.diploma.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    // --- диагностика того, что реально приходит ---
    console.log('[PATCH diplomas] CT=', req.headers['content-type']);
    console.log('[PATCH diplomas] has req.file =', !!req.file, ' has req.files =', Array.isArray(req.files) ? req.files.length : 0);
    if (req.file) {
      console.log('[PATCH diplomas] req.file =', {
        fieldname: req.file.fieldname, filename: req.file.filename, path: req.file.path, size: req.file.size, mimetype: req.file.mimetype, originalname: req.file.originalname
      });
    } else if (Array.isArray(req.files) && req.files[0]) {
      const f = req.files[0];
      console.log('[PATCH diplomas] req.files[0] =', {
        fieldname: f.fieldname, filename: f.filename, path: f.path, size: f.size, mimetype: f.mimetype, originalname: f.originalname
      });
    }

    // --- поля (camel + snake) ---
    const b = req.body || {};
    const studentName   = b.studentName   ?? b.student_name;
    const faculty       = b.faculty       ?? b.faculty_key;
    const specialty     = b.specialty     ?? b.specialty_key;
    const year          = b.year          ?? b.year_value;
    const diplomaNumber = b.diplomaNumber ?? b.diploma_number;
    const isVerified    = b.isVerified    ?? b.is_verified;

    const data = {};
    if (studentName !== undefined)   data.studentName   = String(studentName);
    if (faculty !== undefined)       data.faculty       = faculty || null;
    if (specialty !== undefined)     data.specialty     = specialty || null;
    if (year !== undefined)          data.year          = Number(year);
    if (diplomaNumber !== undefined) data.diplomaNumber = String(diplomaNumber);
    if (isVerified !== undefined)    data.isVerified    = (isVerified==='true'||isVerified===true||isVerified==='1'||isVerified===1);

    // === ФАЙЛ: сперва пытаемся через multer, если пусто — через express-fileupload/base64 ===
    let newFileUrl = null;

// 1) Multer: req.file или req.files (array)
    if (req.file || (Array.isArray(req.files) && req.files.length)) {
      const f = req.file || req.files[0];
      const srcPath = f.path || (f.filename ? path.join(uploadDir, f.filename) : null);
      const orig = f.originalname || f.filename || '';
      let ext = (path.extname(orig) || '').toLowerCase();
      if (!ext) {
        const mt = String(f.mimetype || '').toLowerCase();
        if (mt === 'image/jpeg') ext = '.jpg';
        else if (mt === 'image/png') ext = '.png';
        else if (mt === 'application/pdf') ext = '.pdf';
        else ext = '.bin';
      }
      // Кладём под фиксированным именем по id
      await fs.promises.mkdir(uploadDir, { recursive: true });
      const fixedAbs = path.join(uploadDir, `${id}${ext}`);
      if (srcPath) {
        await fs.promises.rename(srcPath, fixedAbs).catch(async () => {
          const buf = await fs.promises.readFile(srcPath);
          await fs.promises.writeFile(fixedAbs, buf);
          await fs.promises.unlink(srcPath).catch(() => {});
        });
      } else if (f.buffer) {
        await fs.promises.writeFile(fixedAbs, f.buffer);
      }
      newFileUrl = `/uploads/${id}${ext}`;
      console.log('[PATCH diplomas] multer ->', newFileUrl);
    }

// 2) Если multer ничего не дал — пробуем express-fileupload (object) / base64
    if (!newFileUrl) {
      // эта утилита уже у тебя есть и умеет: req.files (object, express-fileupload) + валидацию + сохранение
      const tmpRel = validateAndStoreFileFromAnySource(req) || validateAndStoreBase64FromBody(req);
      if (tmpRel) {
        // можно оставить tmpRel как есть (проще всего)
        newFileUrl = tmpRel;
        console.log('[PATCH diplomas] fallback ->', newFileUrl,
            ' req.files type=', typeof req.files,
            !Array.isArray(req.files) && req.files ? Object.keys(req.files) : null);
      }
    }

// 3) Если что-то сохранили — обновляем запись
    if (newFileUrl) {
      data.fileUrl = newFileUrl;                 // ВАЖНО: имя поля как в Prisma (camelCase)
      if ('updatedAt' in existing) data.updatedAt = new Date();
      console.log('[PATCH diplomas] SET fileUrl =', data.fileUrl);
    } else {
      console.log('[PATCH diplomas] no file provided (multer/express-fileupload/base64)');
    }

    console.log('[PATCH diplomas] data keys ->', Object.keys(data));

    const updated = await prisma.diploma.update({ where: { id }, data });
    console.log('[PATCH diplomas] updated.fileUrl =', updated.fileUrl);
    return res.json(updated);

  } catch (e) {
    console.error('[PATCH diplomas] ERROR', e);
    next(e);
  }
});



// DELETE
router.delete('/diplomas/:id', async (req, res, next) => {
  try {
    const id = idStr(req.params.id);
    if (!id || id === 'undefined' || id === 'null') return res.status(400).json({ message: 'Invalid id' });

    const existing = await prisma.diploma.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await prisma.diploma.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
