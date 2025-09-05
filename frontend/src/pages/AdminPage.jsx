import React, { useEffect, useMemo, useState } from 'react';
import { getDiplomas, getFilters, verifyDiploma, deleteDiploma } from '../services/diplomaService';
import FilterBar from '../components/FilterBar';
import DiplomaTable from '../components/DiplomaTable';
import EditDiplomaModal from '../components/EditDiplomaModal';
import InviteBar from '../components/InviteBar';

export default function AdminPage() {
  const [opts, setOpts] = useState({
    facultiesOptions: [],
    specialtyOptionsByFacultyKey: {},
    specialtyToFaculty: {},
    allSpecialtyOptions: [],
  });

  const [q, setQ] = useState('');
  const [scope, setScope] = useState('unverified');
  const [sort, setSort] = useState('createdAt');
  const [dir, setDir] = useState('desc');
  const [facultyKey, setFacultyKey] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState(null);

  useEffect(() => {
    (async () => {
      const f = await getFilters();
      const stf = {}; const all = []; const seen = new Set();
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
    })();
  }, []);

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
      const params = {
        q, sort, dir, page,
        is_verified: scope === 'verified' ? 'true' : (scope === 'unverified' ? 'false' : undefined),
        faculty: facultyKey || undefined,
        specialty: specialty || undefined,
      };
      const { rows, total } = await getDiplomas(params);
      setRows(rows || []);
      setTotal(total || 0);
    } finally { setBusy(false); }
  };

  useEffect(() => { fetchData(); }, [q, facultyKey, specialty, scope, sort, dir, page]);

  const onVerify = async (id, curr) => { await verifyDiploma(id, !curr); await fetchData(); };
  const onDelete = async (id) => {
    if (!window.confirm('Видалити запис?')) return;
    await deleteDiploma(id); await fetchData();
  };
  const onEdit = (row) => row?.id && setEditing(row);
  const onSaved = () => { setEditing(null); fetchData(); };

  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Адмін</h1>
        <InviteBar />
        <FilterBar
            q={q} setQ={setQ}
            sort={sort} setSort={setSort}
            dir={dir} setDir={setDir}
            facultyKey={facultyKey} setFacultyKey={setFacultyKey}
            specialty={specialty} setSpecialty={setSpecialty}
            facultiesOptions={opts.facultiesOptions}
            specialtyOptions={specOptions}
            showScope={true}
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
            onEdit={onEdit}
            showStatus={true}
        />

        {editing?.id && (
               <EditDiplomaModal
               id={editing.id}
               onClose={() => setEditing(null)}
               onSaved={onSaved}
             />
           )}
      </div>
  );
}
