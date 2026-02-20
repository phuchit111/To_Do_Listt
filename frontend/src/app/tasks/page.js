'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { taskAPI, categoryAPI, userAPI } from '../../lib/api';
import Sidebar from '../../components/Sidebar';

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending', cls: 'badge-pending' },
    { value: 'IN_PROGRESS', label: 'In Progress', cls: 'badge-in-progress' },
    { value: 'COMPLETED', label: 'Completed', cls: 'badge-completed' },
];

export default function TasksPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', status: 'PENDING', dueDate: '', categoryId: '', taggedUserIds: [],
    });

    // Category modal
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');

    // Delete confirm
    const [deleteId, setDeleteId] = useState(null);

    // Tag dropdown
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }
        if (user) {
            loadAll();
        }
    }, [user, authLoading]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [t, c, u] = await Promise.all([
                taskAPI.list({ search, status: filterStatus, categoryId: filterCategory }),
                categoryAPI.list(),
                userAPI.list(),
            ]);
            setTasks(t);
            setCategories(c);
            setUsers(u);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Reload when filters change
    useEffect(() => {
        if (user) {
            const timeout = setTimeout(() => {
                loadTasks();
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [search, filterStatus, filterCategory]);

    const loadTasks = async () => {
        try {
            const t = await taskAPI.list({ search, status: filterStatus, categoryId: filterCategory });
            setTasks(t);
        } catch (err) {
            console.error(err);
        }
    };

    // Open modal
    const openAdd = () => {
        setEditingTask(null);
        setForm({ title: '', description: '', status: 'PENDING', dueDate: '', categoryId: '', taggedUserIds: [] });
        setShowModal(true);
    };

    const openEdit = (task) => {
        setEditingTask(task);
        setForm({
            title: task.title,
            description: task.description || '',
            status: task.status,
            dueDate: task.dueDate ? task.dueDate.slice(0, 16) : '',
            categoryId: task.categoryId || '',
            taggedUserIds: task.tags?.map(t => t.userId) || [],
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTask(null);
    };

    // Save task
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: form.title,
                description: form.description || null,
                status: form.status,
                dueDate: form.dueDate || null,
                categoryId: form.categoryId || null,
                taggedUserIds: form.taggedUserIds,
            };

            if (editingTask) {
                await taskAPI.update(editingTask.id, payload);
            } else {
                await taskAPI.create(payload);
            }
            closeModal();
            loadTasks();
        } catch (err) {
            alert(err.message);
        }
    };

    // Quick status toggle
    const cycleStatus = async (task) => {
        const order = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
        const next = order[(order.indexOf(task.status) + 1) % 3];
        try {
            await taskAPI.update(task.id, { status: next });
            loadTasks();
        } catch (err) {
            console.error(err);
        }
    };

    // Delete
    const confirmDelete = async () => {
        try {
            await taskAPI.delete(deleteId);
            setDeleteId(null);
            loadTasks();
        } catch (err) {
            alert(err.message);
        }
    };

    // Category
    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await categoryAPI.create({ name: newCategoryName, color: newCategoryColor });
            setNewCategoryName('');
            setNewCategoryColor('#6366f1');
            setShowCategoryModal(false);
            const c = await categoryAPI.list();
            setCategories(c);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await categoryAPI.delete(id);
            const c = await categoryAPI.list();
            setCategories(c);
        } catch (err) {
            alert(err.message);
        }
    };

    // Tag toggle
    const toggleTag = (userId) => {
        setForm(prev => ({
            ...prev,
            taggedUserIds: prev.taggedUserIds.includes(userId)
                ? prev.taggedUserIds.filter(id => id !== userId)
                : [...prev.taggedUserIds, userId],
        }));
    };

    // Helpers
    const isOverdue = (task) =>
        task.dueDate && task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date();

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (authLoading || !user) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1>Tasks</h1>
                        <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowCategoryModal(true)}>
                            🏷️ Categories
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={openAdd} id="add-task-btn">
                            ＋ Add Task
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="tasks-toolbar">
                    <input
                        className="search-input"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="search-input"
                    />
                    <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} id="filter-status">
                        <option value="">All Status</option>
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} id="filter-category">
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Task list */}
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : tasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">📝</div>
                        <h3>No tasks yet</h3>
                        <p>Click "Add Task" to create your first task</p>
                    </div>
                ) : (
                    <div className="tasks-list">
                        {tasks.map((task) => (
                            <div className="task-card" key={task.id}>
                                <div className="task-card-header">
                                    <h3 className={task.status === 'COMPLETED' ? 'completed-task' : ''}>
                                        {task.title}
                                    </h3>
                                    <div className="task-card-actions">
                                        <button className="btn-icon" title="Toggle status" onClick={() => cycleStatus(task)}>
                                            {task.status === 'COMPLETED' ? '↩️' : task.status === 'IN_PROGRESS' ? '✅' : '▶️'}
                                        </button>
                                        <button className="btn-icon" title="Edit" onClick={() => openEdit(task)}>✏️</button>
                                        <button className="btn-icon" title="Delete" onClick={() => setDeleteId(task.id)}>🗑️</button>
                                    </div>
                                </div>

                                {task.description && (
                                    <div className="task-card-body">
                                        <p>{task.description}</p>
                                    </div>
                                )}

                                <div className="task-card-meta">
                                    <span className={`badge ${STATUS_OPTIONS.find(s => s.value === task.status)?.cls}`}>
                                        {STATUS_OPTIONS.find(s => s.value === task.status)?.label}
                                    </span>

                                    {task.category && (
                                        <span className="badge badge-category" style={{ borderColor: task.category.color, color: task.category.color }}>
                                            {task.category.name}
                                        </span>
                                    )}

                                    {isOverdue(task) && <span className="badge badge-overdue">Overdue</span>}

                                    {task.dueDate && (
                                        <span className={`task-due ${isOverdue(task) ? 'overdue' : ''}`}>
                                            📅 {formatDate(task.dueDate)}
                                        </span>
                                    )}

                                    {task.tags?.map(tag => (
                                        <span className="badge badge-user" key={tag.id}>@{tag.user.name}</span>
                                    ))}

                                    {user.role === 'ADMIN' && task.user && (
                                        <span className="task-owner">by {task.user.name}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* === ADD/EDIT TASK MODAL === */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    id="task-title"
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="What needs to be done?"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    id="task-description"
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Add details..."
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        id="task-status"
                                        value={form.status}
                                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        id="task-category"
                                        value={form.categoryId}
                                        onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                                    >
                                        <option value="">None</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Due Date & Time</label>
                                <input
                                    id="task-due"
                                    type="datetime-local"
                                    value={form.dueDate}
                                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tag Users</label>
                                <div className="multi-select" onClick={() => setShowTagDropdown(!showTagDropdown)}>
                                    {form.taggedUserIds.length === 0 && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.1rem' }}>Click to tag users...</span>
                                    )}
                                    {form.taggedUserIds.map(uid => {
                                        const u = users.find(u => u.id === uid);
                                        return u ? (
                                            <span className="multi-select-tag" key={uid}>
                                                {u.name}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); toggleTag(uid); }}>×</button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                                {showTagDropdown && (
                                    <div className="user-dropdown">
                                        {users.filter(u => u.id !== user.id).map(u => (
                                            <div
                                                className="user-dropdown-item"
                                                key={u.id}
                                                onClick={() => toggleTag(u.id)}
                                                style={{
                                                    background: form.taggedUserIds.includes(u.id) ? 'var(--accent-glow)' : 'transparent',
                                                }}
                                            >
                                                {form.taggedUserIds.includes(u.id) ? '✓ ' : ''}{u.name} ({u.email})
                                            </div>
                                        ))}
                                        {users.filter(u => u.id !== user.id).length === 0 && (
                                            <div className="user-dropdown-item" style={{ color: 'var(--text-muted)' }}>No other users</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} id="save-task-btn">
                                    {editingTask ? 'Save Changes' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === CATEGORY MODAL === */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>🏷️ Manage Categories</h2>
                        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Category name"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                required
                                style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                            />
                            <input
                                type="color"
                                value={newCategoryColor}
                                onChange={e => setNewCategoryColor(e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                            />
                            <button type="submit" className="btn btn-primary btn-sm" style={{ width: 'auto' }}>Add</button>
                        </form>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {categories.map(cat => (
                                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }}></span>
                                        <span style={{ fontSize: '0.9rem' }}>{cat.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({cat._count?.tasks || 0} tasks)</span>
                                    </div>
                                    <button className="btn-icon" onClick={() => handleDeleteCategory(cat.id)} title="Delete category" style={{ border: 'none' }}>🗑️</button>
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No categories yet</p>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === DELETE CONFIRM === */}
            {deleteId && (
                <div className="confirm-overlay" onClick={() => setDeleteId(null)}>
                    <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                        <h3>Delete Task?</h3>
                        <p>This action cannot be undone.</p>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn btn-danger btn-sm" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
