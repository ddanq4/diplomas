import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
    const nav = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [err, setErr] = useState('');

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        try {
            await login(form.email, form.password);
            nav('/admin');
        } catch (e) {
            setErr(e?.message || 'Login error');
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-4">
            <h1 className="text-2xl font-bold">Вхід</h1>
            {err && <div className="text-red-600">{err}</div>}
            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    className="w-full border p-2 rounded"
                    value={form.email}
                    onChange={onChange}
                    required
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Пароль"
                    className="w-full border p-2 rounded"
                    value={form.password}
                    onChange={onChange}
                    required
                />
                <button className="px-4 py-2 rounded bg-blue-600 text-white w-full">Увійти</button>
            </form>
        </div>
    );
}
