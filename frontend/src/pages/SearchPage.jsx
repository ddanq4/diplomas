import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDiplomas, getFilters, verifyDiploma, deleteDiploma } from '../services/diplomaService';
import FilterBar from '../components/FilterBar';
import DiplomaTable from '../components/DiplomaTable';
import { useAuth } from '../hooks/useAuth';

export default function SearchPage() {
    const { isAdmin } = useAuth();
    const [sp, setSp] = useSearchParams();

    const [opts, setOpts] = useState({
        facultiesOptions: [],
        specialtyOptionsByFacultyKey: {},
        specialtyToFaculty: {},
        allSpecialtyOptions: [],
    });

    const [q, setQ] = useState(sp.get('q') || '');
    const [sort, setSort] = useState(sp.get('sort') || 'createdAt');
    const [dir, setDir] = useState(sp.get('dir') || 'desc');
    const [facultyKey, setFacultyKey] = useState(sp.get('faculty') || '');
    const [specialty, setSpecialty] = useState(sp.get('specialty') || '');
    const [page, setPage] = useState(Number(sp.get('page') || 1));


    const [scope, setScope] = useState(sp.get('scope') || (isAdmin ? 'all' : 'verified'));

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        (async () => {
            const f = await getFilters();
            const stf = {}, all = [], seen = new Set();
            Object.entries(f.specialtyOptionsByFacultyKey || {}).forEach(([fk, arr]) => {
                (arr || []).forEach(s => {
                    stf[s.key] = fk;
                    if (!seen.has(s.key)) { seen.add(s.key); all.push({ key: s.key, label: s.label }); }
                });
            });
            setOpts({
                facultiesOptions: f.facultiesOptions || [],
                specialtyOptionsByFacultyKey: f.specialtyOptionsByFacultyKey || {},
                specialtyToFaculty: stf,
                allSpecialtyOptions: all,
            });

            const urlSpec = (sp.get('specialty') || '').trim();
            if (urlSpec && !sp.get('faculty')) {
                const fk = stf[urlSpec] || '';
                if (fk) setFacultyKey(fk);
            }
        })();
    }, [sp]);

    useEffect(() => {
        if (!facultyKey || !specialty) return;
        const fkOfSpec = opts.specialtyToFaculty[specialty];
        if (fkOfSpec && fkOfSpec !== facultyKey) setSpecialty('');
    }, [facultyKey, specialty, opts.specialtyToFaculty]);

    useEffect(() => {
        if (!specialty) return;
        const fk = opts.specialtyToFaculty[specialty];
        if (fk && fk !== facultyKey) setFacultyKey(fk);
    }, [specialty, facultyKey, opts.specialtyToFaculty]);

    const specOptions = useMemo(() => {
        if (facultyKey) return opts.specialtyOptionsByFacultyKey[facultyKey] || [];
        return opts.allSpecialtyOptions || [];
    }, [facultyKey, opts.specialtyOptionsByFacultyKey, opts.allSpecialtyOptions]);

    const fetchData = async () => {
        setBusy(true);
        try {
            let is_verified = 'true';
            if (isAdmin) {
                is_verified = scope === 'verified' ? 'true'
                    : scope === 'unverified' ? 'false'
                        : undefined;
            }

            const { rows, total } = await getDiplomas({
                q, sort, dir, page,
                is_verified,
                faculty: facultyKey || undefined,
                specialty: specialty || undefined,
            });
            setRows(rows || []);
            setTotal(total || 0);
        } finally { setBusy(false); }
    };

    useEffect(() => {
        const p = new URLSearchParams();
        if (q) p.set('q', q);
        if (facultyKey) p.set('faculty', facultyKey);
        if (specialty) p.set('specialty', specialty);
        if (isAdmin && scope !== 'all') p.set('scope', scope);
        if (sort !== 'createdAt') p.set('sort', sort);
        if (dir !== 'desc') p.set('dir', dir);
        if (page !== 1) p.set('page', String(page));
        setSp(p, { replace: true });
    }, [q, facultyKey, specialty, scope, sort, dir, page, setSp, isAdmin]);

    useEffect(() => { fetchData(); }, [q, facultyKey, specialty, scope, sort, dir, page, isAdmin]);

    const onVerify = isAdmin ? async (id, curr) => { await verifyDiploma(id, !curr); await fetchData(); } : undefined;
    const onDelete = isAdmin ? async (id) => {
        if (!window.confirm('Видалити запис?')) return;
        await deleteDiploma(id); await fetchData();
    } : undefined;

    return (
        <div className="space-y-6">
            <FilterBar
                q={q} setQ={setQ}
                sort={sort} setSort={setSort}
                dir={dir} setDir={setDir}
                facultyKey={facultyKey} setFacultyKey={setFacultyKey}
                specialty={specialty} setSpecialty={setSpecialty}
                facultiesOptions={opts.facultiesOptions}
                specialtyOptions={specOptions}
                showScope={isAdmin}
                scope={scope} setScope={setScope}
            />
            <DiplomaTable
                rows={rows}
                total={total}
                page={page}
                setPage={setPage}
                busy={busy}
                onVerify={onVerify}
                onDelete={onDelete}
                showStatus={isAdmin}
            />
        </div>
    );
}
