import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getDiploma, verifyDiploma, deleteDiploma } from '../services/diplomaService';
import { useAuth } from '../hooks/useAuth';
import { apiUrl } from '../services/api';

export default function DiplomaDetailPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const { isAdmin } = useAuth();

    const [row, setRow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
           if (!id || id === 'undefined' || id === 'null') {
                 setErr('Invalid id');
                 setLoading(false);
                return;
               }
        (async () => {
            setErr('');
            try {
                const data = await getDiploma(id);
                setRow(data);
            } catch (e) {
                setErr(e?.response?.data?.message || 'Load error');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const toggleVerify = async () => {
        if (!row) return;
        setBusy(true);
        try {
            const updated = await verifyDiploma(row.id, !row.isVerified);
            setRow(updated);
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!confirm('Видалити запис?')) return;
        setBusy(true);
        try {
            await deleteDiploma(row.id);
            nav('/admin');
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <div>Завантаження…</div>;
    if (err) return <div className="text-red-600">{err}</div>;
    if (!row) return <div>Не знайдено</div>;

    const fileLink = row.fileUrl
       ? `${apiUrl(`/diplomas/${row.id}/file`)}?v=${encodeURIComponent(row.updatedAt)}`
           : '';
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Диплом</h1>
                <Link className="text-blue-600 underline" to="/search">← До пошуку</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border rounded p-3">
                    <div className="font-semibold">ПІБ</div>
                    <div>{row.studentName}</div>
                </div>
                <div className="border rounded p-3">
                    <div className="font-semibold">Факультет</div>
                    <div>{row.facultyName || row.faculty || '—'}</div>
                </div>
                <div className="border rounded p-3">
                    <div className="font-semibold">Спеціальність</div>
                    <div>{row.specialty || '-'}</div>
                </div>
                <div className="border rounded p-3">
                    <div className="font-semibold">Рік</div>
                    <div>{row.year}</div>
                </div>
                <div className="border rounded p-3">
                    <div className="font-semibold">№ диплому</div>
                    <div>{row.diplomaNumber}</div>
                </div>
                <div className="border rounded p-3">
                    <div className="font-semibold">Статус</div>
                    <div>{row.isVerified ? 'Підтверджено' : 'Не підтверджено'}</div>
                </div>
                <div className="border rounded p-3">
                    <div className="font-semibold">Створено</div>
                    <div>{new Date(row.createdAt).toLocaleString()}</div>
                </div>
                <div className="border rounded p-3">
                    <div className="font-semibold">Оновлено</div>
                    <div>{new Date(row.updatedAt).toLocaleString()}</div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="font-semibold">Файл</div>
                {!fileLink ? (
                    '—'
                ) : (
                    <a
                        className="inline-block px-3 py-2 bg-blue-600 text-white rounded"
                        href={fileLink}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Відкрити файл у новій вкладці
                    </a>
                )}
            </div>

            {isAdmin && (
                <div className="flex gap-2">
                    <button
                        disabled={busy}
                        onClick={toggleVerify}
                        className={`px-4 py-2 rounded ${row.isVerified ? 'bg-gray-200' : 'bg-green-600 text-white'}`}
                    >
                        {row.isVerified ? 'Зняти підтвердження' : 'Підтвердити'}
                    </button>
                    <button
                        disabled={busy}
                        onClick={remove}
                        className="px-4 py-2 rounded bg-red-600 text-white"
                    >
                        Видалити
                    </button>
                </div>
            )}
        </div>
    );
}
