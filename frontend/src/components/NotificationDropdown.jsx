'use client';

import { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../lib/api';
import { Bell, Tag, MessageSquare, RefreshCw, Clock } from 'lucide-react';

export default function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await notificationAPI.list();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (err) {
            // Silently fail
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationAPI.markRead(id);
            loadNotifications();
        } catch (err) { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllRead();
            loadNotifications();
        } catch (err) { /* ignore */ }
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    const typeIcon = (type) => {
        switch (type) {
            case 'tagged': return <Tag size={16} />;
            case 'comment': return <MessageSquare size={16} />;
            case 'status_change': return <RefreshCw size={16} />;
            case 'reminder': return <Clock size={16} />;
            default: return <Bell size={16} />;
        }
    };

    return (
        <div className="notif-wrapper" ref={ref}>
            <button className="notif-bell" onClick={() => setOpen(!open)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {open && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        <strong>Notifications</strong>
                        {unreadCount > 0 && (
                            <button className="notif-mark-all" onClick={handleMarkAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    className={`notif-item ${!n.read ? 'unread' : ''}`}
                                    key={n.id}
                                    onClick={() => { if (!n.read) handleMarkRead(n.id); }}
                                >
                                    <span className="notif-icon">{typeIcon(n.type)}</span>
                                    <div className="notif-content">
                                        <span className="notif-msg">{n.message}</span>
                                        <span className="notif-time">{timeAgo(n.createdAt)}</span>
                                    </div>
                                    {!n.read && <span className="notif-unread-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
