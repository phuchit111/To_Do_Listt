'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { projectAPI } from '../lib/api';
import {
    LayoutDashboard, ListTodo, Columns, Calendar,
    Settings, LogOut, Plus, Trash2, X, Menu,
    Sun, Moon
} from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [showAddProject, setShowAddProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#6366f1');
    const activeProjectId = searchParams.get('project') || '';

    const PROJECT_COLORS = ['#6366f1', '#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];

    useEffect(() => {
        if (user) loadProjects();
    }, [user]);

    const loadProjects = async () => {
        try {
            const data = await projectAPI.list();
            setProjects(data);
        } catch (e) { /* ignore */ }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        try {
            await projectAPI.create({ name: newProjectName.trim(), color: newProjectColor });
            setNewProjectName('');
            setShowAddProject(false);
            loadProjects();
        } catch (e) { /* ignore */ }
    };

    const handleDeleteProject = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this project? Tasks will become unassigned.')) return;
        try {
            await projectAPI.delete(id);
            loadProjects();
        } catch (e) { /* ignore */ }
    };

    const projectLink = (projectId) => {
        return `${pathname}${projectId ? `?project=${projectId}` : ''}`;
    };

    return (
        <>
            <button className="mobile-toggle" onClick={() => setOpen(!open)}>
                <Menu size={24} style={{ pointerEvents: 'none' }} />
            </button>
            <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2>TaskFlow</h2>
                        <NotificationDropdown />
                    </div>
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
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link
                        href="/tasks"
                        className={pathname === '/tasks' && !activeProjectId ? 'active' : ''}
                        onClick={() => setOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                        <ListTodo size={18} /> Tasks
                    </Link>
                    <Link
                        href="/board"
                        className={pathname === '/board' ? 'active' : ''}
                        onClick={() => setOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                        <Columns size={18} /> Board
                    </Link>
                    <Link
                        href="/calendar"
                        className={pathname === '/calendar' ? 'active' : ''}
                        onClick={() => setOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                        <Calendar size={18} /> Calendar
                    </Link>
                    <Link
                        href="/settings"
                        className={pathname === '/settings' ? 'active' : ''}
                        onClick={() => setOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                        <Settings size={18} /> Settings
                    </Link>
                </nav>

                {/* Projects */}
                <div className="sidebar-projects">
                    <div className="sidebar-projects-header">
                        <span className="sidebar-section-title">Projects</span>
                        <button
                            className="sidebar-add-btn"
                            onClick={() => setShowAddProject(!showAddProject)}
                            title="New Project"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {showAddProject && (
                        <form className="sidebar-add-form" onSubmit={handleAddProject}>
                            <input
                                type="text"
                                placeholder="Project name"
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                autoFocus
                            />
                            <div className="color-picker-row">
                                {PROJECT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`color-dot ${newProjectColor === c ? 'active' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => setNewProjectColor(c)}
                                    />
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Add</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddProject(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px' }}>
                                    <X size={14} />
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="sidebar-project-list">
                        {projects.map(proj => (
                            <Link
                                key={proj.id}
                                href={`/tasks?project=${proj.id}`}
                                className={`sidebar-project-item ${activeProjectId === proj.id ? 'active' : ''}`}
                                onClick={() => setOpen(false)}
                            >
                                <span className="project-dot" style={{ background: proj.color }} />
                                <span className="project-name">{proj.name}</span>
                                <span className="project-count">{proj._count?.tasks || 0}</span>
                                <button
                                    className="project-delete"
                                    onClick={(e) => handleDeleteProject(e, proj.id)}
                                    title="Delete"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </Link>
                        ))}
                        {projects.length === 0 && !showAddProject && (
                            <div className="sidebar-empty">No projects yet</div>
                        )}
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
