import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDiploma, getFilters } from '../services/diplomaService';

const MAX_FILE_MB = Number(process.env.REACT_APP_MAX_FILE_MB || 10);
const ALLOWED_EXTS = ['pdf', 'png', 'jpg', 'jpeg'];

const extOf = (name = '') => (String(name).toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/)?.[1] || '');
const isAllowedType = (file) =>
    !!file && (ALLOWED_EXTS.includes(extOf(file.name)) || file.type === 'application/pdf' || file.type === 'image/png' || file.type === 'image/jpeg');
const formatSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
const validateFile = (file) => {
  if (!file) return { ok: false, message: 'Файл не обрано' };
  if (!isAllowedType(file)) return { ok: false, message: 'Дозволені лише PDF, PNG, JPG' };
  if (file.size > MAX_FILE_MB * 1024 * 1024) return { ok: false, message: `Максимальний розмір ${MAX_FILE_MB} МБ (ваш ${formatSize(file.size)})` };
  return { ok: true };
};

export default function AddDiplomaPage() {
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [opts, setOpts] = useState({
    facultiesOptions: [],                 // [{key,name}]
    specialtyOptionsByFacultyKey: {},     // { facKey: [{key,label}] }
    specialtyToFaculty: {},               // { specKey: facKey }
  });

  const [form, setForm] = useState({
    studentName: '',
    facultyKey: '',
    specialty: '',
    year: '',
    diplomaNumber: '',
  });

  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const allSpecOptions = useMemo(() => {
    const seen = new Set(); const all = [];
    Object.entries(opts.specialtyOptionsByFacultyKey).forEach(([fk, arr]) => {
      (arr || []).forEach(s => {
        if (!seen.has(s.key)) { seen.add(s.key); all.push({ key: s.key, label: s.label }); }
      });
    });
    return all;
  }, [opts.specialtyOptionsByFacultyKey]);

  const specOptions = useMemo(() => {
    if (form.facultyKey) return opts.specialtyOptionsByFacultyKey[form.facultyKey] || [];
    return allSpecOptions;
  }, [form.facultyKey, opts.specialtyOptionsByFacultyKey, allSpecOptions]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getFilters();
        const stf = {};
        Object.entries(data.specialtyOptionsByFacultyKey || {}).forEach(([fk, arr]) =>
            (arr || []).forEach(s => { stf[s.key] = fk; })
        );
        setOpts({
          facultiesOptions: data.facultiesOptions || [],
          specialtyOptionsByFacultyKey: data.specialtyOptionsByFacultyKey || {},
          specialtyToFaculty: stf,
        });
      } catch (e) {
        setErr(e?.payload?.message || e?.message || 'Помилка завантаження довідників');
      }
    })();
  }, []);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') { setFile(files?.[0] || null); return; }

    if (name === 'specialty') {
      const fk = opts.specialtyToFaculty[value] || '';
      setForm(prev => ({ ...prev, specialty: value, facultyKey: fk || prev.facultyKey }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'facultyKey') setForm(prev => ({ ...prev, specialty: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    const realFile = file || fileRef.current?.files?.[0] || null;
    const vf = validateFile(realFile);
    if (!vf.ok) { setErr(vf.message); return; }

    try {
      setBusy(true);
      const fd = new FormData();
      fd.append('studentName', form.studentName.trim());
      fd.append('specialty', form.specialty);
      fd.append('year', String(form.year));
      fd.append('diplomaNumber', form.diplomaNumber.trim());
      fd.append('file', realFile);

      const saved = await createDiploma(fd);
      nav(`/diplomas/${saved?.id || ''}`);
    } catch (e2) {
      setErr(e2?.payload?.message || e2?.message || 'Помилка збереження');
    } finally {
      setBusy(false);
    }
  };

  return (
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Додати диплом</h1>
        {err && <div className="mb-3 text-red-600">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
              name="studentName"
              value={form.studentName}
              onChange={onChange}
              placeholder="ПІБ"
              className="w-full border p-2 rounded"
              required
          />

          <select
              name="facultyKey"
              value={form.facultyKey}
              onChange={onChange}
              className="w-full border p-2 rounded"
          >
            <option value="">Оберіть факультет (необовʼязково)</option>
            {opts.facultiesOptions.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
          </select>

          <select
              name="specialty"
              value={form.specialty}
              onChange={onChange}
              className="w-full border p-2 rounded"
              required
          >
            <option value="">
              {form.facultyKey ? 'Оберіть спеціальність факультету' : 'Оберіть спеціальність'}
            </option>
            {specOptions.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>

          <div className="flex gap-2">
            <input
                name="year"
                type="number"
                min="1900"
                max="2100"
                value={form.year}
                onChange={onChange}
                placeholder="Рік"
                className="w-40 border p-2 rounded"
                required
            />
            <input
                name="diplomaNumber"
                value={form.diplomaNumber}
                onChange={onChange}
                placeholder="№ диплому"
                className="flex-1 border p-2 rounded"
                required
            />
          </div>

          <div className="space-y-1">
            <input
                ref={fileRef}
                name="file"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={onChange}
                className="w-full border p-2 rounded"
                required
            />
            <div className="text-xs opacity-70">Дозволено: pdf, png, jpg. Максимум: {MAX_FILE_MB} МБ.</div>
          </div>

          <button disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded">
            {busy ? 'Завантаження…' : 'Зберегти'}
          </button>
        </form>
      </div>
  );
}
