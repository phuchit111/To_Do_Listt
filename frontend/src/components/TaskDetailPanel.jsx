'use client';

import { useState, useEffect, useRef } from 'react';
import { taskAPI, commentAPI, attachmentAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';

import {
    X, Check, Plus, Trash2, Image, FileText,
    Archive, Film, Music, Paperclip, AlertCircle,
    Circle, Send, MessageSquare, Clock, Activity,
    Calendar as CalendarIcon
} from 'lucide-react';

const PRIORITY_MAP = {
    URGENT: { label: 'Urgent', color: '#ef4444' },
    HIGH: { label: 'High', color: '#f97316' },
    NORMAL: { label: 'Normal', color: '#6366f1' },
    LOW: { label: 'Low', color: '#94a3b8' },
};

const STATUS_MAP = {
    PENDING: { label: 'Pending', cls: 'badge-pending' },
    IN_PROGRESS: { label: 'In Progress', cls: 'badge-in-progress' },
    COMPLETED: { label: 'Completed', cls: 'badge-completed' },
};

export default function TaskDetailPanel({ taskId, onClose, onUpdate }) {
    const { user } = useAuth();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('comments');
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Subtask form
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [subtaskTitle, setSubtaskTitle] = useState('');

    // Attachments
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (taskId) {
            loadTask();
            loadAttachments();
        }
    }, [taskId]);

    const loadTask = async () => {
        setLoading(true);
        try {
            const t = await taskAPI.get(taskId);
            setTask(t);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            await commentAPI.create(taskId, commentText);
            setCommentText('');
            loadTask();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await commentAPI.delete(taskId, commentId);
            loadTask();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await taskAPI.update(taskId, { status: newStatus });
            loadTask();
            onUpdate?.();
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePriorityChange = async (newPriority) => {
        try {
            await taskAPI.update(taskId, { priority: newPriority });
            loadTask();
            onUpdate?.();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!subtaskTitle.trim()) return;
        try {
            await taskAPI.create({ title: subtaskTitle, parentId: taskId });
            setSubtaskTitle('');
            setShowSubtaskForm(false);
            loadTask();
            onUpdate?.();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubtaskToggle = async (subtask) => {
        const next = subtask.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        try {
            await taskAPI.update(subtask.id, { status: next });
            loadTask();
            onUpdate?.();
        } catch (err) {
            console.error(err);
        }
    };

    const loadAttachments = async () => {
        try {
            const data = await attachmentAPI.list(taskId);
            setAttachments(data);
        } catch (err) { /* ignore */ }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            await attachmentAPI.upload(taskId, file);
            loadAttachments();
            loadTask();
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteAttachment = async (id) => {
        try {
            await attachmentAPI.delete(taskId, id);
            loadAttachments();
        } catch (err) {
            alert(err.message);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const fileIcon = (mime) => {
        if (mime?.startsWith('image/')) return <Image size={16} />;
        if (mime?.includes('pdf')) return <FileText size={16} />;
        if (mime?.includes('zip') || mime?.includes('rar')) return <Archive size={16} />;
        if (mime?.includes('video')) return <Film size={16} />;
        if (mime?.includes('audio')) return <Music size={16} />;
        return <Paperclip size={16} />;
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    if (!taskId) return null;

    return (
        <>
            <div className="detail-overlay" onClick={onClose} />
            <div className="detail-panel">
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : task ? (
                    <>
                        {/* Header */}
                        <div className="detail-header">
                            <button className="btn-icon" onClick={onClose} title="Close" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={20} />
                            </button>
                            <div style={{ flex: 1 }} />
                            {task.userId === user?.id && (
                                <span className="badge badge-user" style={{ fontSize: '0.7rem' }}>Owner</span>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className="detail-title">{task.title}</h2>

                        {/* Status & Priority row */}
                        <div className="detail-meta-row">
                            <div className="detail-meta-item">
                                <span className="detail-label">Status</span>
                                <select
                                    className="filter-select"
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                                >
                                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="detail-meta-item">
                                <span className="detail-label">Priority</span>
                                <select
                                    className="filter-select"
                                    value={task.priority}
                                    onChange={(e) => handlePriorityChange(e.target.value)}
                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                                >
                                    {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="detail-meta-row">
                            {task.dueDate && (
                                <div className="detail-meta-item">
                                    <span className="detail-label">Due Date</span>
                                    <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <CalendarIcon size={14} />
                                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            )}
                            {task.category && (
                                <div className="detail-meta-item">
                                    <span className="detail-label">Category</span>
                                    <span className="badge badge-category" style={{ borderColor: task.category.color, color: task.category.color }}>
                                        {task.category.name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Assignees */}
                        {task.tags?.length > 0 && (
                            <div className="detail-section">
                                <span className="detail-label">Tagged Users</span>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                                    {task.tags.map(tag => (
                                        <span className="badge badge-user" key={tag.id}>@{tag.user.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {task.description && (
                            <div className="detail-section">
                                <span className="detail-label">Description</span>
                                <p className="detail-desc">{task.description}</p>
                            </div>
                        )}

                        {/* Subtasks */}
                        <div className="detail-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="detail-label">
                                    Subtasks ({task.subtasks?.filter(s => s.status === 'COMPLETED').length || 0}/{task.subtasks?.length || 0})
                                </span>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                    <Plus size={12} /> Add
                                </button>
                            </div>

                            {showSubtaskForm && (
                                <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Subtask title..."
                                        value={subtaskTitle}
                                        onChange={(e) => setSubtaskTitle(e.target.value)}
                                        className="search-input"
                                        style={{ flex: 1, paddingLeft: '0.75rem', fontSize: '0.82rem' }}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.3rem 0.6rem' }}>Add</button>
                                </form>
                            )}

                            <div className="subtask-list">
                                {task.subtasks?.map(sub => (
                                    <div className="subtask-item" key={sub.id}>
                                        <button
                                            className={`subtask-check ${sub.status === 'COMPLETED' ? 'checked' : ''}`}
                                            onClick={() => handleSubtaskToggle(sub)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            {sub.status === 'COMPLETED' ? <Check size={12} /> : ''}
                                        </button>
                                        <span className={sub.status === 'COMPLETED' ? 'completed-task' : ''}>
                                            {sub.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="detail-tabs">
                            <button
                                className={`detail-tab ${activeTab === 'comments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('comments')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <MessageSquare size={14} /> Comments ({task.comments?.length || 0})
                            </button>
                            <button
                                className={`detail-tab ${activeTab === 'attachments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('attachments')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <Paperclip size={14} /> Files ({attachments.length})
                            </button>
                            <button
                                className={`detail-tab ${activeTab === 'activity' ? 'active' : ''}`}
                                onClick={() => setActiveTab('activity')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <Activity size={14} /> Activity
                            </button>
                        </div>

                        {/* Comments Tab */}
                        {activeTab === 'comments' && (
                            <div className="detail-tab-content">
                                <div className="comments-list">
                                    {task.comments?.length === 0 && (
                                        <p className="empty-hint">No comments yet</p>
                                    )}
                                    {task.comments?.map(c => (
                                        <div className="comment-item" key={c.id}>
                                            <div className="comment-header">
                                                <strong>{c.user.name}</strong>
                                                <span className="comment-time">{timeAgo(c.createdAt)}</span>
                                                {(c.userId === user?.id || user?.role === 'ADMIN') && (
                                                    <button className="btn-icon" onClick={() => handleDeleteComment(c.id)}
                                                        style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="comment-body">{c.content}</p>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddComment} className="comment-form">
                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        className="search-input"
                                        style={{ flex: 1, paddingLeft: '0.75rem' }}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-sm"
                                        disabled={submitting || !commentText.trim()}
                                        style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <Send size={14} /> Send
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Attachments Tab */}
                        {activeTab === 'attachments' && (
                            <div className="detail-tab-content">
                                <div className="attachment-upload">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleUpload}
                                        style={{ display: 'none' }}
                                        id="attachment-input"
                                    />
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        {uploading ? 'Uploading...' : <><Plus size={16} /> Upload File</>}
                                    </button>
                                </div>
                                <div className="attachment-list">
                                    {attachments.length === 0 && (
                                        <p className="empty-hint">No files attached</p>
                                    )}
                                    {attachments.map(att => (
                                        <div className="attachment-item" key={att.id}>
                                            <span className="attachment-icon">{fileIcon(att.mimetype)}</span>
                                            <div className="attachment-info">
                                                <a
                                                    href={`http://localhost:5000${att.path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="attachment-name"
                                                >
                                                    {att.filename}
                                                </a>
                                                <span className="attachment-meta">
                                                    {formatFileSize(att.size)} · {att.user?.name} · {timeAgo(att.createdAt)}
                                                </span>
                                            </div>
                                            {(att.userId === user?.id || user?.role === 'ADMIN') && (
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleDeleteAttachment(att.id)}
                                                    style={{ border: 'none', fontSize: '0.7rem', padding: '0.15rem 0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="detail-tab-content">
                                <div className="activity-list">
                                    {task.activities?.length === 0 && (
                                        <p className="empty-hint">No activity yet</p>
                                    )}
                                    {task.activities?.map(a => (
                                        <div className="activity-item" key={a.id}>
                                            <div className="activity-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                                            </div>
                                            <div>
                                                <span className="activity-text">
                                                    <strong>{a.user.name}</strong>{' '}
                                                    {a.action === 'created' && 'created this task'}
                                                    {a.action === 'status_changed' && (() => {
                                                        const d = JSON.parse(a.details || '{}');
                                                        return `changed status from ${d.from} to ${d.to}`;
                                                    })()}
                                                    {a.action === 'priority_changed' && (() => {
                                                        const d = JSON.parse(a.details || '{}');
                                                        return `changed priority from ${d.from} to ${d.to}`;
                                                    })()}
                                                    {a.action === 'comment_added' && 'added a comment'}
                                                    {a.action === 'file_attached' && (() => {
                                                        const d = JSON.parse(a.details || '{}');
                                                        return `attached ${d.filename || 'a file'}`;
                                                    })()}
                                                </span>
                                                <span className="activity-time">{timeAgo(a.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p>Task not found</p>
                )}
            </div>
        </>
    );
}
