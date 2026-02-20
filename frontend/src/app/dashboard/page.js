'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../lib/api';
import Sidebar from '../../components/Sidebar';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }
        if (user) fetchData();
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

    if (authLoading || !user) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    const circumference = 2 * Math.PI * 58;
    const offset = data ? circumference - (data.completionPercent / 100) * circumference : circumference;
    const maxCategoryCount = data ? Math.max(...data.byCategory.map(c => c.count), 1) : 1;

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
                                <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>📋</div>
                                <div className="stat-value">{data.total}</div>
                                <div className="stat-label">Total Tasks</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>⏳</div>
                                <div className="stat-value">{data.pending}</div>
                                <div className="stat-label">Pending</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>🔄</div>
                                <div className="stat-value">{data.inProgress}</div>
                                <div className="stat-label">In Progress</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>✅</div>
                                <div className="stat-value">{data.completed}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>🔥</div>
                                <div className="stat-value">{data.overdue}</div>
                                <div className="stat-label">Overdue</div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="charts-grid">
                            {/* Completion Ring */}
                            <div className="chart-card">
                                <h3>Completion Rate</h3>
                                <div className="progress-ring">
                                    <div className="progress-ring-visual">
                                        <svg width="140" height="140">
                                            <circle className="ring-bg" cx="70" cy="70" r="58" fill="none" strokeWidth="10" />
                                            <circle
                                                className="ring-fill"
                                                cx="70" cy="70" r="58"
                                                fill="none"
                                                strokeWidth="10"
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

                            {/* Category bars */}
                            <div className="chart-card">
                                <h3>Tasks by Category</h3>
                                <div className="bar-chart">
                                    {data.byCategory.length === 0 ? (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No categories yet</p>
                                    ) : (
                                        data.byCategory.map((cat, i) => (
                                            <div className="bar-item" key={i}>
                                                <span className="bar-label">{cat.name}</span>
                                                <div className="bar-track">
                                                    <div
                                                        className="bar-fill"
                                                        style={{
                                                            width: `${(cat.count / maxCategoryCount) * 100}%`,
                                                            background: cat.color,
                                                        }}
                                                    >
                                                        {cat.count}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upcoming */}
                        <div className="upcoming-list">
                            <h3>📅 Upcoming Deadlines</h3>
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
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="emoji">📊</div>
                        <h3>No data available</h3>
                        <p>Start adding tasks to see your dashboard analytics</p>
                    </div>
                )}
            </main>
        </div>
    );
}
