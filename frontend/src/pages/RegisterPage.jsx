import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

export default function RegisterPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const inviteFromUrl = params.get('invite') || '';
  const [form, setForm] = useState({ email: '', password: '', inviteCode: inviteFromUrl });
  const [err, setErr] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await api.post('/register', form);
      localStorage.setItem('token', data.token);
      nav('/admin');
    } catch (e) {
      setErr(e.response?.data?.message || 'Register error');
    }
  };

  return (
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Реєстрація</h1>
        {err && <div className="text-red-600">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <input name="email" type="email" placeholder="Email" className="w-full border p-2 rounded"
                 value={form.email} onChange={onChange} required />
          <input name="password" type="password" placeholder="Пароль" className="w-full border p-2 rounded"
                 value={form.password} onChange={onChange} required />
          <input name="inviteCode" placeholder="Код інвайту" className="w-full border p-2 rounded"
                 value={form.inviteCode} onChange={onChange} />
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Створити акаунт</button>
        </form>
      </div>
  );
}
