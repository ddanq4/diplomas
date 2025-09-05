import React, { useMemo } from 'react';

export default function FilterBar({
                                      q, setQ,
                                      sort, setSort,
                                      dir, setDir,
                                      facultyKey, setFacultyKey,
                                      specialty, setSpecialty,
                                      facultiesOptions = [],
                                      specialtyOptions = [],
                                      // показывать ли селектор области (только админ)
                                      showScope = false,
                                      scope, setScope,
                                      onReset,
                                  }) {
    const sortOptions = useMemo(() => ([
        { value: 'createdAt', label: 'За створенням' },
        { value: 'year', label: 'За роком' },
        { value: 'studentName', label: 'ПІБ' },
        { value: 'diplomaNumber', label: '№ диплому' },
    ]), []);

    const internalReset = () => {
        setQ('');
        setFacultyKey('');
        setSpecialty('');
        setSort('createdAt');
        setDir('desc');
        if (showScope && setScope) setScope('all');
    };

    const doReset = onReset || internalReset;

    return (
        <div className="w-full grid grid-cols-12 gap-3 items-stretch bg-white/75 p-3 rounded-xl shadow-sm">
            <div className="col-span-12 md:col-span-6 flex gap-2">
                <input
                    className="flex-1 h-10 rounded-md border border-gray-300 px-3"
                    type="text"
                    placeholder="Пошук (ПІБ або № диплому)…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            <div className="col-span-12 sm:col-span-6 md:col-span-3">
                <select
                    className="w-full h-10 rounded-md border border-gray-300 px-3"
                    value={facultyKey}
                    onChange={(e) => setFacultyKey(e.target.value)}
                >
                    <option value="">Усі факультети</option>
                    {facultiesOptions.map(f => (
                        <option key={f.key} value={f.key}>{f.name}</option>
                    ))}
                </select>
            </div>

            <div className="col-span-12 sm:col-span-6 md:col-span-3">
                <select
                    className="w-full h-10 rounded-md border border-gray-300 px-3"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                >
                    <option value="">Усі спеціальності</option>
                    {specialtyOptions.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                </select>
            </div>

            {showScope && (
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                    <select
                        className="w-full h-10 rounded-md border border-gray-300 px-3"
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                    >
                        <option value="all">Всі</option>
                        <option value="verified">Лише підтверджені</option>
                        <option value="unverified">Лише непідтверджені</option>
                    </select>
                </div>
            )}

            <div className="col-span-8 sm:col-span-6 md:col-span-3 flex gap-2">
                <select
                    className="flex-1 h-10 rounded-md border border-gray-300 px-3"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                    type="button"
                    className="h-10 min-w-[44px] rounded-md border border-gray-300 px-3"
                    onClick={() => setDir(dir === 'desc' ? 'asc' : 'desc')}
                    title={dir === 'desc' ? 'Спадання' : 'Зростання'}
                >
                    {dir === 'desc' ? '▼' : '▲'}
                </button>
            </div>

            <div className="col-span-4 sm:col-span-6 md:col-span-2 flex justify-end">
                <button
                    type="button"
                    onClick={doReset}
                    className="h-10 rounded-md border border-gray-300 px-4"
                >
                    Скинути
                </button>
            </div>
        </div>
    );
}
