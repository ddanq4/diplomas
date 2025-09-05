import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import api from '../services/api';

const EP_ME = '/me';
const EP_LOGIN = '/login';
const EP_LOGOUT = '/logout';

const STORAGE_KEY = 'auth/state/v1';

function useAuthState() {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
        catch { return null; }
    });
    const [ready, setReady] = useState(false);

    const persist = (u) => {
        setUser(u);
        try {
            if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
            else localStorage.removeItem(STORAGE_KEY);
        } catch {}
    };

    const isAuthed = !!(user && (user.email || user.isAdmin));
    const isAdmin = !!user?.isAdmin;

    const refresh = useCallback(async () => {
        try {
            const res = await api.get(EP_ME, {
                headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache', 'If-Modified-Since': '0' },
                validateStatus: () => true,
            });

            const { status, data } = res;
            if (status >= 200 && status < 300) {
                const email = data?.email ?? data?.user?.email ?? null;
                const admin = !!(data?.isAdmin || data?.role === 'admin' || data?.user?.isAdmin || data?.user?.role === 'admin');
                if (email || admin) {
                    persist({ email, isAdmin: admin });
                    setReady(true);
                    return true;
                }
                persist(null);
                setReady(true);
                return false;
            }

            persist(null);
            setReady(true);
            return false;
        } catch {
            persist(null);
            setReady(true);
            return false;
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const login = async (email, password) => {
        const res = await api.post(EP_LOGIN, { email, password }, { validateStatus: () => true });
        const { status, data } = res;

        if (status >= 200 && status < 300) {
            if (data?.token) {
                try { localStorage.setItem('token', data.token); } catch {}
            }
            const ok = await refresh();
            if (!ok) throw new Error('Login error');
            return;
        }
        if (status === 401 || status === 403) {
            throw new Error(data?.message || 'Невірний логін або пароль');
        }
        throw new Error(data?.message || 'Помилка авторизації');
    };

    const logout = async () => {
        try { await api.post(EP_LOGOUT, null, { validateStatus: () => true }); } catch {}
        try { localStorage.removeItem('token'); } catch {}
        persist(null);
    };

    return { user, isAuthed, isAdmin, ready, refresh, login, logout };
}

const AuthContext = createContext({
    user: null,
    isAuthed: false,
    isAdmin: false,
    ready: false,
    refresh: async () => {},
    login: async () => {},
    logout: async () => {},
});

export function AuthProvider({ children }) {
    const auth = useAuthState();
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}

export default useAuth;
