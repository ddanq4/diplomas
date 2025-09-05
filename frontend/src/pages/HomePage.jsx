import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function HomePage() {
    const nav = useNavigate();
    const [rows, setRows] = useState([]);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/diplomas/faculties'); // { faculties: [...] }
                const list = (data?.faculties || []).map(f => ({
                    facKey: f.faculty || f.key || f.name, // ключ факультета
                    name: f.name || f.title || f.faculty,
                    count: Number(f.count || 0),
                    specialties: (f.specialties || []).map(s => ({
                        key: s.key || s.name,
                        name: s.name || s.label || s.key,
                        count: Number(s.count || 0),
                    })),
                }));
                setRows(list);
            } catch (e) {
                setErr(e?.response?.data?.message || e?.message || 'Помилка завантаження');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const goSearch = (params) => {
        const qs = new URLSearchParams(params);
        nav(`/search?${qs.toString()}`);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-semibold mb-4">Факультети та спеціальності</h1>

            {err && <div className="text-red-600 mb-3">{err}</div>}
            {loading && <div>Завантаження…</div>}

            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rows.map(f => (
                        <div key={f.facKey} className="border rounded p-3">
                            <div className="font-semibold mb-2">
                                <button
                                    type="button"
                                    className="hover:underline cursor-pointer"
                                    onClick={() => goSearch({ faculty: f.facKey, scope: 'verified' })}
                                    title="Показати дипломи цього факультету"
                                >
                                    {f.name}
                                </button>
                                {!!f.count && <span className="ml-2 text-xs opacity-60">({f.count})</span>}
                            </div>

                            <details>
                                <summary className="cursor-pointer select-none">Спеціальності</summary>
                                <ul className="mt-2 space-y-1">
                                    {f.specialties.map(s => (
                                        <li key={s.key} className="flex justify-between">
                                            <button
                                                type="button"
                                                className="text-left hover:underline cursor-pointer"
                                                onClick={() => goSearch({ specialty: s.key, scope: 'verified' })}
                                                title="Показати дипломи за спеціальністю"
                                            >
                                                {s.name}
                                            </button>
                                            <span className="text-xs opacity-60">{s.count}</span>
                                        </li>
                                    ))}
                                    {f.specialties.length === 0 && <li className="text-sm opacity-60">Немає спеціальностей</li>}
                                </ul>
                            </details>
                        </div>
                    ))}
                    {rows.length === 0 && <div>Немає даних</div>}
                </div>
            )}
        </div>
    );
}
