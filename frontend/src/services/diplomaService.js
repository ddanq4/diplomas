import api from './api';

function buildUrl(path) {
    const base = (api?.defaults?.baseURL || '').replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${p}` : p;
}

function extractFile(formData) {
    let file = null;
    for (const [k, v] of formData.entries()) if (v instanceof File) { file = v; break; }
    return file;
}

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = reject;
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(file);
    });
}

async function fetchJson(url, opts = {}) {
    const res = await fetch(url, { credentials: 'include', ...opts });
    const ct = res.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    if (!res.ok) {
        let payload = {};
        try { payload = isJson ? await res.json() : { message: await res.text() }; } catch {}
        const err = new Error(payload?.message || res.statusText || 'Request failed');
        err.status = res.status; err.payload = payload; throw err;
    }
    return isJson ? res.json() : {};
}

/**/
export async function getFilters() {
    const { data } = await api.get('/diplomas/filters'); return data || {};
}
export async function getDiplomas(params = {}) {
    const clean = {};
      for (const [k, v] of Object.entries(params)) {
            if (v === '' || v === null || v === undefined) continue;
            if (k === 'page' || k === 'limit' || k === 'year') {
                  const n = Number(v); if (Number.isFinite(n)) clean[k] = n; continue;
                }
            clean[k] = v;
          }
      const { data } = await api.get('/diplomas', { params: clean });
      return data;}
export async function getDiploma(id) {
    const { data } = await api.get(`/diplomas/${id}`); return data;
}


export async function createDiploma(formData) {
    try {
        return await fetchJson(buildUrl('/diplomas'), { method: 'POST', body: formData });
    } catch (e) {
        if (e?.status === 400 && /File is required/i.test(e?.payload?.message || e.message)) {
            const file = extractFile(formData);
            if (!file) throw e;
            const dataUrl = await fileToDataURL(file);
            const json = Object.fromEntries(formData.entries());
            delete json.file;
            json.fileBase64 = dataUrl;
            json.fileName = file.name;
            json.fileType = file.type;
            return await fetchJson(buildUrl('/diplomas'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(json),
            });
        }
        throw e;
    }
}

export async function updateDiploma(id, formData) {
    let file = null;
    for (const [, v] of formData.entries()) if (v instanceof File) { file = v; break; }

    if (file) {
        const toDataURL = (f) => new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = rej;
            r.readAsDataURL(f);
        });

        const json = Object.fromEntries(formData.entries());
        delete json.file;
        json.fileBase64 = await toDataURL(file);
        json.fileName   = file.name;
        json.fileType   = file.type;

        return await fetch(`${(api?.defaults?.baseURL || '').replace(/\/+$/,'')}/diplomas/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json),
        }).then(r => r.json());
    }

    return await fetch(`${(api?.defaults?.baseURL || '').replace(/\/+$/,'')}/diplomas/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
    }).then(r => r.json());
}


export async function deleteDiploma(id) {
    const { data } = await api.delete(`/diplomas/${id}`); return data;
}
export async function verifyDiploma(id, value = true) {
    const { data } = await api.patch(`/diplomas/${id}`, { isVerified: !!value }); return data;
}
export async function unverifyDiploma(id) { return verifyDiploma(id, false); }
