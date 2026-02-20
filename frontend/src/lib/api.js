const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function request(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server is unreachable. Please check backend connection.');
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

async function uploadFile(endpoint, file) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
}

// Auth
export const authAPI = {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

// Tasks
export const taskAPI = {
    list: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
        const qs = query.toString();
        return request(`/tasks${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/tasks/${id}`),
    create: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
    reorder: (updates) => request('/tasks/reorder', { method: 'PUT', body: JSON.stringify({ updates }) }),
};

// Comments
export const commentAPI = {
    list: (taskId) => request(`/tasks/${taskId}/comments`),
    create: (taskId, content) => request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
    delete: (taskId, commentId) => request(`/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),
};

// Attachments
export const attachmentAPI = {
    list: (taskId) => request(`/tasks/${taskId}/attachments`),
    upload: (taskId, file) => uploadFile(`/tasks/${taskId}/attachments`, file),
    delete: (taskId, attachmentId) => request(`/tasks/${taskId}/attachments/${attachmentId}`, { method: 'DELETE' }),
};

// Categories
export const categoryAPI = {
    list: () => request('/categories'),
    create: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// Users
export const userAPI = {
    list: () => request('/users'),
};

// Dashboard
export const dashboardAPI = {
    get: () => request('/dashboard'),
};

// Notifications
export const notificationAPI = {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};

// Projects
export const projectAPI = {
    list: () => request('/projects'),
    create: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
};

// Profile
export const profileAPI = {
    get: () => request('/profile'),
    update: (body) => request('/profile', { method: 'PUT', body: JSON.stringify(body) }),
    changePassword: (body) => request('/profile/password', { method: 'PUT', body: JSON.stringify(body) }),
};

