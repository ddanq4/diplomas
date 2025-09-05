import React, { useEffect, useState } from 'react';
import { listInvites, createInvite, revokeInvite } from '../services/inviteService';

function statusOf(i) {
    const now = Date.now();
    if (i.revokedAt) return 'revoked';
    if (i.usedAt) return 'used';
    if (i.expiresAt && new Date(i.expiresAt).getTime() <= now) return 'expired';
    return 'active';
}

export default function InviteBar() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [minutes, setMinutes] = useState(10);
    const [creating, setCreating] = useState(false);
    const [err, setErr] = useState('');

    const load = async () => {
        try {
            setLoading(true);
            setErr('');
            const data = await listInvites();
            setItems(Array.isArray(data) ? data : []);
        } catch {
            setErr('Не вдалося завантажити список інвайтів');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const onCreate = async () => {
        try {
            setCreating(true);
            setErr('');
            const m = Number(minutes) || 1440;
            await createInvite(m);
            await load();
        } catch {
            setErr('Не вдалося створити інвайт');
        } finally {
            setCreating(false);
        }
    };

    const onRevoke = async (id) => {
        if (!window.confirm('Відмінити цей інвайт?')) return;
        try {
            await revokeInvite(id);
            await load();
        } catch {
            setErr('Не вдалося відмінити інвайт');
        }
    };

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Скопійовано');
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert('Скопійовано');
        }
    };

    const copyCode = (code) => copy(code);
    const copyLink = (code) => copy(`${window.location.origin}/register?invite=${encodeURIComponent(code)}`);

    const quick = (d) => setMinutes(d);

    return (
        <div className="border rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg m-0">Інвайти</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Час дії (хв)</span>
                    <input
                        type="number"
                        min="1"
                        value={minutes}
                        onChange={e => setMinutes(e.target.value)}
                        className="w-28 border rounded px-2 py-1"
                    />
                    <button onClick={() => quick(10)} className="px-2 py-1 border rounded">10 хвилин</button>
                    <button onClick={() => quick(1440)} className="px-2 py-1 border rounded">1 день</button>
                    <button onClick={() => quick(10080)} className="px-2 py-1 border rounded">1 тиждень</button>
                    <button onClick={onCreate} disabled={creating} className="px-3 py-1 bg-blue-600 text-white rounded">
                        {creating ? 'Створюється…' : 'Створити інвайт'}
                    </button>
                </div>
            </div>

            {err && <div className="text-red-600 mb-2">{err}</div>}

            {loading ? (
                <div>Загрузка…</div>
            ) : items.length === 0 ? (
                <div>Пока нет инвайтов</div>
            ) : (
                <table className="w-full">
                    <thead>
                    <tr className="text-left border-b">
                        <th className="py-2 pr-2">Код</th>
                        <th className="py-2 pr-2">Статус</th>
                        <th className="py-2 pr-2">Сторений</th>
                        <th className="py-2 pr-2">Закінчується</th>
                        <th className="py-2 pr-2">Дії</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map(i => {
                        const st = statusOf(i);
                        const created = i.createdAt ? new Date(i.createdAt).toLocaleString() : '—';
                        const expires = i.expiresAt ? new Date(i.expiresAt).toLocaleString() : '—';
                        const inactive = st !== 'active';
                        return (
                            <tr key={i.id} className="border-b">
                                <td className="py-2 pr-2 font-mono">{i.code}</td>
                                <td className="py-2 pr-2 uppercase">{st}</td>
                                <td className="py-2 pr-2">{created}</td>
                                <td className="py-2 pr-2">{expires}</td>
                                <td className="py-2 pr-2 flex gap-2">
                                    <button onClick={() => copyCode(i.code)} className="px-2 py-1 border rounded">Скопіювати код</button>
                                    <button onClick={() => copyLink(i.code)} className="px-2 py-1 border rounded">Посилання</button>
                                    <button onClick={() => onRevoke(i.id)} disabled={inactive} className="px-2 py-1 border rounded disabled:opacity-50">
                                        Відмінити
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
