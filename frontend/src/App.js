import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import SearchPage from './pages/SearchPage';
import AddDiplomaPage from './pages/AddDiplomaPage';
import DiplomaDetailPage from './pages/DiplomaDetailPage';
import HomePage from './pages/HomePage';
import { useAuth } from './hooks/useAuth';
import logo from './assets/logo.svg';

function Protected({ children }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function Nav() {
    const { user, isAdmin, logout } = useAuth();
    const authed = !!user;

    return (
        <div className="w-full border-b p-3 flex gap-4 items-center bg-white/70">
            <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="Karazin" className="h-7 w-auto" />
            </Link>
            <Link to="/search">Пошук</Link>
            {isAdmin && <Link to="/admin">Адмін</Link>}
            <Link to="/add">Додати</Link>
            <div className="ml-auto flex gap-3 items-center">
                {!authed && <Link to="/login">Вхід</Link>}
                {!authed && <Link to="/register">Реєстрація</Link>}
                {authed && <span className="text-sm opacity-70">{user.email}</span>}
                {authed && <button onClick={logout} className="px-2 py-1 border rounded">Вийти</button>}
            </div>
        </div>
    );
}

export default function App() {
    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            <Nav/>
            <Routes>
                <Route path="/" element={<HomePage/>} />
                <Route path="/search" element={<SearchPage/>} />
                <Route path="/diplomas/:id" element={<DiplomaDetailPage/>} />
                <Route path="/login" element={<LoginPage/>} />
                <Route path="/register" element={<RegisterPage/>} />
                <Route path="/admin" element={<Protected><AdminPage/></Protected>} />
                <Route path="/add" element={<AddDiplomaPage/>} />
                <Route path="*" element={<div>404 — сторінку не знайдено</div>} />
            </Routes>
        </div>
    );
}
