'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../lib/api';
import Link from 'next/link';

export default function RegisterPage() {
    const { login } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authAPI.register(form);
            login(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Create Account</h1>
                <p className="subtitle">Join TaskFlow and start organizing</p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            id="register-name"
                            type="text"
                            placeholder="Your name"
                            value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            id="register-email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            id="register-password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={form.password}
                            onChange={(e) => update('password', e.target.value)}
                            minLength={6}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select
                            id="register-role"
                            value={form.role}
                            onChange={(e) => update('role', e.target.value)}
                        >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <button id="register-submit" className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-link">
                    Already have an account? <Link href="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
