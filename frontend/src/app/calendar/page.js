'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { taskAPI } from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import TaskDetailPanel from '../../components/TaskDetailPanel';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PRIORITY_COLORS = {
    URGENT: '#ef4444',
    HIGH: '#f97316',
    NORMAL: '#6366f1',
    LOW: '#94a3b8',
};

export default function CalendarPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
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

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const getTasksForDay = (day) => {
        return tasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });
    };

    const today = new Date();
    const isToday = (day) =>
        today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        cells.push(<div className="cal-cell empty" key={`e${i}`} />);
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const dayTasks = getTasksForDay(d);
        cells.push(
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

    if (authLoading || !user) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <CalendarIcon size={24} /> Calendar
                    </h1>
                    <div className="cal-nav">
                        <button className="btn btn-secondary btn-sm" onClick={prevMonth} title="Previous Month" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <span className="cal-month-title">{MONTHS[month]} {year}</span>
                        <button className="btn btn-secondary btn-sm" onClick={nextMonth} title="Next Month" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRight size={16} />
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={goToday} style={{ marginLeft: '0.5rem' }}>Today</button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <div className="cal-grid">
                        {DAYS.map(d => <div className="cal-header" key={d}>{d}</div>)}
                        {cells}
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
