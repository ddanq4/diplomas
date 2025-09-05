import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../services/api';

export default function DiplomaTable({
                                         rows = [],
                                         total = 0,
                                         page = 1,
                                         setPage = () => {},
                                         pageSize = 20,
                                         busy = false,
                                         onVerify,
                                         onDelete,
                                         onEdit,
                                         showStatus = false,
                                     }) {
    const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
    const goto = (p) => { const np = Math.min(Math.max(1, p), pages); if (np !== page) setPage(np); };

    const actions = !!onVerify || !!onDelete || !!onEdit;

    return (
        <div className="bg-white/75 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                    <tr>
                        <th className="px-3 py-2 text-left">ПІБ</th>
                        <th className="px-3 py-2 text-left">Факультет</th>
                        <th className="px-3 py-2 text-left">Спеціальність</th>
                        <th className="px-3 py-2 text-left">Рік</th>
                        <th className="px-3 py-2 text-left">№ диплому</th>
                        <th className="px-3 py-2 text-left">Файл</th>
                        {showStatus && <th className="px-3 py-2 text-left">Статус</th>}
                        {actions && <th className="px-3 py-2 text-right">Дії</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {busy && (
                        <tr>
                            <td
                                colSpan={6 + (showStatus ? 1 : 0) + (actions ? 1 : 0)}
                                className="px-3 py-6 text-center text-gray-500"
                            >
                                Завантаження…
                            </td>
                        </tr>
                    )}

                    {!busy && rows.length === 0 && (
                        <tr>
                            <td
                                colSpan={6 + (showStatus ? 1 : 0) + (actions ? 1 : 0)}
                                className="px-3 py-6 text-center text-gray-500"
                            >
                                Немає результатів
                            </td>
                        </tr>
                    )}

                    {!busy && rows.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                                {r?.id ? (
                                       <Link to={`/diplomas/${r.id}`} className="text-blue-700 hover:underline">{r.studentName || '—'}</Link>
                                     ) : (
                                       <span>{r.studentName || '—'}</span>
                                     )}
                            </td>
                            <td className="px-3 py-2">{r.facultyName || '—'}</td>
                            <td className="px-3 py-2">{r.specialty || '—'}</td>
                            <td className="px-3 py-2">{r.year ?? '—'}</td>
                            <td className="px-3 py-2">{r.diplomaNumber || '—'}</td>
                            <td className="px-3 py-2">
                                {r.fileUrl && r?.id ?(
                                    <a
                                       href={`${apiUrl(`/diplomas/${r.id}/file`)}?v=${encodeURIComponent(r.updatedAt || '')}`}
                                       target="_blank" rel="noreferrer" className="text-blue-600 hover:underline"
                                     >
                                       Відкрити
                                     </a>
                                ) : '—'}

                            </td>
                            {showStatus && (
                                <td className="px-3 py-2">
                                    {r.isVerified ? (
                                        <span className="inline-block rounded bg-green-100 text-green-700 px-2 py-0.5">Підтверджено</span>
                                    ) : (
                                        <span className="inline-block rounded bg-yellow-100 text-yellow-800 px-2 py-0.5">Не підтверджено</span>
                                    )}
                                </td>
                            )}
                            {actions && (
                                <td className="px-3 py-2 text-right">
                                    {onEdit && (
                                           <button
                                             className="mr-2 rounded-md border px-2 py-1 disabled:opacity-50"
                                             onClick={(e) => { e.stopPropagation(); r?.id && onEdit(r); }}
                                             disabled={!r?.id}
                                             title="Редагувати"
                                           >
                                             Редагувати
                                           </button>
                                         )}
                                    {onVerify && (
                                        <button
                                            className="mr-2 rounded-md border px-2 py-1"
                                            onClick={(e) => { e.stopPropagation(); onVerify(r.id, !!r.isVerified); }}
                                            title={r.isVerified ? 'Зняти підтвердження' : 'Підтвердити'}
                                        >
                                            {r.isVerified ? 'Зняти' : 'Підтвердити'}
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            className="rounded-md border px-2 py-1 text-red-700"
                                            onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                                            title="Видалити"
                                        >
                                            Видалити
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="p-3 flex items-center justify-between">
                <button
                    className="rounded-md border px-2 py-1 disabled:opacity-50"
                    onClick={() => goto(page - 1)}
                    disabled={page <= 1}
                >
                    Попередня
                </button>
                <span className="text-sm text-gray-600">
          Сторінка <span className="font-medium">{page}</span> з <span className="font-medium">{pages}</span>
        </span>
                <button
                    className="rounded-md border px-2 py-1 disabled:opacity-50"
                    onClick={() => goto(page + 1)}
                    disabled={page >= pages}
                >
                    Наступна
                </button>
            </div>
        </div>
    );
}
