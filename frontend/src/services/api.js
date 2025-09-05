import axios from 'axios';

const HOST = (process.env.REACT_APP_API_URL || 'http://localhost:5000')
    .trim()
    .replace(/\/+$/, '');

export const API_BASE = HOST;
export const apiUrl = (p = '') => `${HOST}/api/${String(p).replace(/^\/+/, '')}`;

const api = axios.create({
    baseURL: `${HOST}/api`,
    withCredentials: true,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

api.interceptors.request.use((cfg) => {
    const t = localStorage.getItem('token');
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
});

export default api;
