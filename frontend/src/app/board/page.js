'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { taskAPI } from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import TaskDetailPanel from '../../components/TaskDetailPanel';

import {
    Columns, Clock, RefreshCw, CheckCircle2,
    CheckSquare, MessageSquare, Calendar
} from 'lucide-react';

const COLUMNS = [
    { status: 'PENDING', label: 'Pending', color: '#f59e0b' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: '#6366f1' },
    { status: 'COMPLETED', label: 'Completed', color: '#22c55e' },
];

const PRIORITY_COLORS = {
    URGENT: '#ef4444',
    HIGH: '#f97316',
    NORMAL: '#6366f1',
    LOW: '#94a3b8',
};

export default function BoardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggingId, setDraggingId] = useState(null);
    const [detailTaskId, setDetailTaskId] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) { router.replace('/login'); return; }
        if (user) loadTasks();
    }, [user, authLoading]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const t = await taskAPI.list();
            setTasks(t);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getColumn = (status) => tasks.filter(t => t.status === status);

    const handleDragStart = (e, taskId) => {
        setDraggingId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        if (!draggingId) return;

        const task = tasks.find(t => t.id === draggingId);
        if (!task || task.status === newStatus) {
            setDraggingId(null);
            return;
        }

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === draggingId ? { ...t, status: newStatus } : t));
        setDraggingId(null);

        try {
            await taskAPI.update(draggingId, { status: newStatus });
        } catch (err) {
            console.error(err);
            loadTasks(); // rollback on error
        }
    };

    const isOverdue = (t) =>
        t.dueDate && t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date();

    if (authLoading || !user) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Columns size={24} /> Board
                    </h1>
                    <p>Drag tasks between columns to update status</p>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <div className="board-container">
                        {COLUMNS.map(col => (
                            <div
                                className="board-column"
                                key={col.status}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.status)}
                            >
                                <div className="board-column-header" style={{ borderTopColor: col.color }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {col.status === 'PENDING' && <Clock size={16} />}
                                        {col.status === 'IN_PROGRESS' && <RefreshCw size={16} />}
                                        {col.status === 'COMPLETED' && <CheckCircle2 size={16} />}
                                        {col.label}
                                    </span>
                                    <span className="board-count">{getColumn(col.status).length}</span>
                                </div>
                                <div className="board-column-body">
                                    {getColumn(col.status).map(task => (
                                        <div
                                            className={`board-card ${draggingId === task.id ? 'dragging' : ''}`}
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onClick={() => setDetailTaskId(task.id)}
                                        >
                                            <div className="board-card-priority" style={{ background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.NORMAL }} />
                                            <div className="board-card-content">
                                                <h4 className={task.status === 'COMPLETED' ? 'completed-task' : ''}>{task.title}</h4>
                                                <div className="board-card-meta">
                                                    {task.category && (
                                                        <span className="badge badge-category" style={{ borderColor: task.category.color, color: task.category.color, fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                                            {task.category.name}
                                                        </span>
                                                    )}
                                                    {isOverdue(task) && <span className="badge badge-overdue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>Overdue</span>}
                                                    {task.dueDate && !isOverdue(task) && (
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="board-card-bottom">
                                                    <div className="board-card-avatars">
                                                        {task.tags?.slice(0, 3).map(tag => (
                                                            <span className="board-avatar" key={tag.id} title={tag.user.name}>
                                                                {tag.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        ))}
                                                        {task.tags?.length > 3 && <span className="board-avatar">+{task.tags.length - 3}</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        {task.subtasks?.length > 0 && (
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                                <CheckSquare size={12} /> {task.subtasks.filter(s => s.status === 'COMPLETED').length}/{task.subtasks.length}
                                                            </span>
                                                        )}
                                                        {task._count?.comments > 0 && (
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                                <MessageSquare size={12} /> {task._count.comments}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {getColumn(col.status).length === 0 && (
                                        <div className="board-empty">
                                            Drop tasks here
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {detailTaskId && (
                <TaskDetailPanel
                    taskId={detailTaskId}
                    onClose={() => setDetailTaskId(null)}
                    onUpdate={loadTasks}
                />
            )}
        </div>
    );
}
