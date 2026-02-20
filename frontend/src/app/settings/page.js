'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
    const { user, loading: authLoading, updateUser } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) { router.replace('/login'); return; }
        if (user) loadProfile();
    }, [user, authLoading]);

    const loadProfile = async () => {
        try {
            const data = await profileAPI.get();
            setProfile(data);
            setName(data.name);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMsg(null); setErr(null); setSaving(true);
        try {
            const updated = await profileAPI.update({ name });
            setProfile({ ...profile, ...updated });
            updateUser({ name: updated.name });
            setMsg('Profile updated successfully!');
        } catch (e) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMsg(null); setErr(null);
        if (newPassword !== confirmPassword) {
            setErr('New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setErr('New password must be at least 6 characters.');
            return;
        }
        setSaving(true);
        try {
            await profileAPI.changePassword({ currentPassword, newPassword });
            setMsg('Password changed successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (e) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || !user) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Settings size={28} /> Settings
                    </h1>
                </div>

                {msg && <div className="toast toast-success">{msg}</div>}
                {err && <div className="toast toast-error">{err}</div>}

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <div className="settings-grid">
                        {/* Profile Card */}
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="profile-avatar-lg">
                                    {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h2>{profile?.name}</h2>
                                    <span className="text-muted">{profile?.email}</span>
                                    <span className="badge badge-user" style={{ marginLeft: '0.5rem' }}>{profile?.role}</span>
                                </div>
                            </div>
                            <div className="profile-stats">
                                <div className="profile-stat">
                                    <span className="profile-stat-value">{profile?._count?.tasks || 0}</span>
                                    <span className="profile-stat-label">Tasks</span>
                                </div>
                                <div className="profile-stat">
                                    <span className="profile-stat-value">{profile?._count?.projects || 0}</span>
                                    <span className="profile-stat-label">Projects</span>
                                </div>
                                <div className="profile-stat">
                                    <span className="profile-stat-value">{profile?._count?.comments || 0}</span>
                                    <span className="profile-stat-label">Comments</span>
                                </div>
                            </div>
                        </div>

                        {/* Edit Profile */}
                        <div className="settings-card">
                            <h3>Edit Profile</h3>
                            <form onSubmit={handleUpdateProfile}>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={profile?.email || ''} disabled className="input-disabled" />
                                </div>
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="settings-card">
                            <h3>Change Password</h3>
                            <form onSubmit={handleChangePassword}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Changing...' : 'Change Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
