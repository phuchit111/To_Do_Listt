const API_BASE = '/api';

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

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }

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
    create: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
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
