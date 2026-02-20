'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <>
            <button className="mobile-toggle" onClick={() => setOpen(!open)}>☰</button>
            <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>✅ TaskFlow</h2>
                    <div className="user-info">
                        {user?.name}
                        <span className="user-role">{user?.role}</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <Link
                        href="/dashboard"
                        className={pathname === '/dashboard' ? 'active' : ''}
                        onClick={() => setOpen(false)}
                    >
                        📊 Dashboard
                    </Link>
                    <Link
                        href="/tasks"
                        className={pathname === '/tasks' ? 'active' : ''}
                        onClick={() => setOpen(false)}
                    >
                        📋 Tasks
                    </Link>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logout}>🚪 Sign Out</button>
                </div>
            </aside>
        </>
    );
}
