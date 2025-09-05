import React, { useEffect, useState, useMemo } from 'react';
import { getDiploma, updateDiploma, getFilters } from '../services/diplomaService';
import { useRef } from 'react';

export default function EditDiplomaModal({ id, onClose, onSaved }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [err, setErr]         = useState('');
    const fileRef = useRef(null);
    const [form, setForm] = useState(null);
    const [newFile, setNewFile] = useState(null);
    const MAX_FILE_MB = 10;
    const ALLOWED = new Set(['application/pdf','image/jpeg','image/png']);

    // поля формы
    const [studentName, setStudentName]   = useState('');
    const [faculty, setFaculty]           = useState('');
    const [specialty, setSpecialty]       = useState('');
    const [year, setYear]                 = useState('');
    const [diplomaNumber, setDiplomaNumber] = useState('');
    const [isVerified, setIsVerified]     = useState(false);
    const [fileUrl, setFileUrl]           = useState('');

    // фильтры
    const [faculties, setFaculties]   = useState([]);
    const [specialties, setSpecialties] = useState([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setErr('');
                setLoading(true);
                const [filters, row] = await Promise.all([
                    getFilters(),           // { faculties: [...], specialties: [...] }
                    getDiploma(id),
                ]);
                if (!mounted) return;

                setFaculties(filters?.faculties || []);
                setSpecialties(filters?.specialties || []);

                setStudentName(row?.studentName || '');
                setFaculty(row?.faculty || '');
                setSpecialty(row?.specialty || '');
                setYear(row?.year ?? '');
                setDiplomaNumber(row?.diplomaNumber || '');
                setIsVerified(!!row?.isVerified);
                setFileUrl(row?.fileUrl || row?.file_url || '');
            } catch (e) {
                setErr(e?.response?.data?.message || e?.message || 'Load error');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const canSave = useMemo(() =>
            studentName.trim() && year && diplomaNumber.trim()
        ,[studentName, year, diplomaNumber]);

    const onSubmit = async (ev) => {
        ev.preventDefault();
        if (!canSave || saving) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('studentName', studentName.trim());
            fd.append('faculty', faculty || '');
            fd.append('specialty', specialty || '');
            fd.append('year', String(Number(year) || ''));
            fd.append('diplomaNumber', diplomaNumber.trim());
            fd.append('isVerified', String(!!isVerified));

            const f = fileRef.current?.files?.[0] || null;
            if (f) fd.set('file', f, f.name);

            console.log('DEBUG: has file?', !!f, f?.name, f?.size);
            console.log('DEBUG: form keys:', Array.from(fd.keys()));

            await updateDiploma(id, fd);
            onSaved?.();
            onClose?.();
        } catch (e) {
            setErr(e?.payload?.message || e?.message || 'Save error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            {/* modal */}
            <div className="relative w-[min(920px,96vw)] max-h-[90vh] overflow-auto rounded-xl bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        Редагувати диплом <span className="text-gray-500">#{id}</span>
                    </h3>
                    <button onClick={onClose} className="rounded-md border px-2 py-1">✕</button>
                </div>

                {err && <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">{err}</div>}

                {loading ? (
                    <div className="py-6 text-center text-gray-600">Завантаження…</div>
                ) : (
                    <form onSubmit={onSubmit} className="space-y-3">
                        <div>
                            <label className="mb-1 block text-sm">ПІБ</label>
                            <input
                                type="text"
                                className="w-full rounded-md border px-3 py-2"
                                value={studentName}
                                onChange={e => setStudentName(e.target.value)}
                                placeholder="ПІБ студента"
                            />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm">Факультет</label>
                                <select
                                    className="nmr-select w-full rounded-md border px-3 py-2"
                                    value={faculty || ''}
                                    onChange={e => setFaculty(e.target.value)}
                                >
                                    <option value="">— Оберіть факультет —</option>
                                    {faculties.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm">Спеціальність</label>
                                <select
                                    className="nmr-select w-full rounded-md border px-3 py-2"
                                    value={specialty || ''}
                                    onChange={e => setSpecialty(e.target.value)}
                                >
                                    <option value="">— Оберіть спеціальність —</option>
                                    {specialties.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm">Рік</label>
                                <input
                                    type="number" min="1900" max="2100"
                                    className="w-full rounded-md border px-3 py-2"
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                    placeholder="2023"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm">№ диплому</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border px-3 py-2"
                                    value={diplomaNumber}
                                    onChange={e => setDiplomaNumber(e.target.value)}
                                    placeholder="Номер"
                                />
                            </div>
                        </div>

                        <div className="pt-1">
                            <label className="mb-1 block text-sm">Новий файл (PDF/JPG/PNG)</label>
                            <input
                                type="file"
                                name="file"
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                ref={fileRef}
                                onChange={(e) => {
                                    const f = e.target.files?.[0] || null;
                                    if (!f) { setNewFile(null); return; }

                                    if (!ALLOWED.has(f.type)) {
                                        setErr('Дозволені лише PDF/JPEG/PNG');
                                        e.target.value = '';
                                        setNewFile(null);
                                        return;
                                    }
                                    if (f.size > MAX_FILE_MB * 1024 * 1024) {
                                        setErr(`Файл > ${MAX_FILE_MB} MB`);
                                        e.target.value = '';
                                        setNewFile(null);
                                        return;
                                    }
                                    setErr('');
                                    setNewFile(f);
                                }}
                            />
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" className="rounded-md border px-3 py-2" onClick={onClose}>
                                Скасувати
                            </button>
                            <button type="submit" disabled={saving || !canSave}>
                                {saving ? 'Збереження…' : 'Зберегти'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
