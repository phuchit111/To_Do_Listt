'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, taskAPI } from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import TaskDetailPanel from '../../components/TaskDetailPanel';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    ListTodo, Clock, RefreshCw, CheckCircle2, AlertCircle, BarChart
} from 'lucide-react';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Calendar state
    const [calTasks, setCalTasks] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [detailTaskId, setDetailTaskId] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }
        if (user) {
            fetchData();
            loadCalTasks();
        }
    }, [user, authLoading]);

    const fetchData = async () => {
        try {
            const d = await dashboardAPI.get();
            setData(d);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCalTasks = async () => {
        try {
            const t = await taskAPI.list();
            setCalTasks(t);
        } catch (err) {
            console.error(err);
        }
    };

    if (authLoading || !user) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    const circumference = 2 * Math.PI * 40;
    const offset = data ? circumference - (data.completionPercent / 100) * circumference : circumference;
    const maxCategoryCount = data ? Math.max(...data.byCategory.map(c => c.count), 1) : 1;

    // Calendar logic
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const PRIORITY_COLORS = { URGENT: '#ef4444', HIGH: '#f97316', NORMAL: '#6366f1', LOW: '#94a3b8' };

    const calYear = currentDate.getFullYear();
    const calMonth = currentDate.getMonth();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const prevMonth = () => setCurrentDate(new Date(calYear, calMonth - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(calYear, calMonth + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const getTasksForDay = (day) => {
        return calTasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day;
        });
    };

    const todayDate = new Date();
    const isToday = (day) =>
        todayDate.getFullYear() === calYear && todayDate.getMonth() === calMonth && todayDate.getDate() === day;

    const calCells = [];
    for (let i = 0; i < firstDay; i++) {
        calCells.push(<div className="cal-cell empty" key={`e${i}`} />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dayTasks = getTasksForDay(d);
        calCells.push(
            <div className={`cal-cell ${isToday(d) ? 'today' : ''}`} key={d}>
                <span className="cal-day-number">{d}</span>
                <div className="cal-tasks">
                    {dayTasks.slice(0, 3).map(task => (
                        <div
                            className={`cal-task ${task.status === 'COMPLETED' ? 'completed' : ''}`}
                            key={task.id}
                            style={{ borderLeftColor: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.NORMAL }}
                            onClick={() => setDetailTaskId(task.id)}
                            title={task.title}
                        >
                            {task.title}
                        </div>
                    ))}
                    {dayTasks.length > 3 && (
                        <span className="cal-more">+{dayTasks.length - 3} more</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>Dashboard</h1>
                    <p>
                        {user.role === 'ADMIN' ? 'Overview of all tasks across all users' : 'Your task overview'}
                    </p>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : data ? (
                    <>
                        {/* Stats */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}><ListTodo size={20} /></div>
                                <div className="stat-value">{data.total}</div>
                                <div className="stat-label">Total Tasks</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><Clock size={20} /></div>
                                <div className="stat-value">{data.pending}</div>
                                <div className="stat-label">Pending</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}><RefreshCw size={20} /></div>
                                <div className="stat-value">{data.inProgress}</div>
                                <div className="stat-label">In Progress</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><CheckCircle2 size={20} /></div>
                                <div className="stat-value">{data.completed}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><AlertCircle size={20} /></div>
                                <div className="stat-value">{data.overdue}</div>
                                <div className="stat-label">Overdue</div>
                            </div>
                        </div>

                        {/* Completion Rate + Upcoming Deadlines */}
                        <div className="charts-grid">
                            {/* Completion Ring */}
                            <div className="chart-card">
                                <h3>Completion Rate</h3>
                                <div className="progress-ring">
                                    <div className="progress-ring-visual">
                                        <svg width="100" height="100">
                                            <circle className="ring-bg" cx="50" cy="50" r="40" fill="none" strokeWidth="8" />
                                            <circle
                                                className="ring-fill"
                                                cx="50" cy="50" r="40"
                                                fill="none"
                                                strokeWidth="8"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={offset}
                                            />
                                        </svg>
                                        <div className="progress-ring-text">
                                            <div className="percent">{data.completionPercent}%</div>
                                            <div className="label">Complete</div>
                                        </div>
                                    </div>
                                    <div className="ring-legend">
                                        <div className="legend-item">
                                            <span className="legend-dot" style={{ background: 'var(--warning)' }}></span>
                                            Pending ({data.pending})
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot" style={{ background: 'var(--info)' }}></span>
                                            In Progress ({data.inProgress})
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot" style={{ background: 'var(--success)' }}></span>
                                            Completed ({data.completed})
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Deadlines */}
                            <div className="upcoming-list">
                                <h3>Upcoming Deadlines</h3>
                                {data.upcoming.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                                        No upcoming deadlines
                                    </p>
                                ) : (
                                    data.upcoming.map((task) => (
                                        <div className="upcoming-item" key={task.id}>
                                            <div>
                                                <div className="upcoming-title">{task.title}</div>
                                                {task.category && (
                                                    <span className="badge badge-category" style={{ borderColor: task.category.color, color: task.category.color }}>
                                                        {task.category.name}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="upcoming-date">
                                                {new Date(task.dueDate).toLocaleDateString('en-US', {
                                                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Calendar — full width */}
                        <div className="chart-card" style={{ marginTop: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CalendarIcon size={18} /> Calendar
                                </h3>
                                <div className="cal-nav">
                                    <button className="btn btn-secondary btn-sm" onClick={prevMonth} title="Previous Month">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="cal-month-title">{MONTHS[calMonth]} {calYear}</span>
                                    <button className="btn btn-secondary btn-sm" onClick={nextMonth} title="Next Month">
                                        <ChevronRight size={16} />
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={goToday} style={{ marginLeft: '0.5rem' }}>Today</button>
                                </div>
                            </div>
                            <div className="cal-grid">
                                {DAYS.map(d => <div className="cal-header" key={d}>{d}</div>)}
                                {calCells}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="emoji"><BarChart size={48} /></div>
                        <h3>No data available</h3>
                        <p>Start adding tasks to see your dashboard analytics</p>
                    </div>
                )}
            </main>

            {detailTaskId && (
                <TaskDetailPanel
                    taskId={detailTaskId}
                    onClose={() => setDetailTaskId(null)}
                    onUpdate={() => { loadCalTasks(); fetchData(); }}
                />
            )}
        </div>
    );
}
