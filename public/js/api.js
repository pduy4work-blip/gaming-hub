/**
 * GameHub Community - API Client & Utility Functions
 */

const API_BASE = '/api';

// Toast Notification Manager
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// Helper: Escape HTML strings to avoid XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Format relative time in Vietnamese
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString.replace(' ', 'T') + (dateString.includes('Z') ? '' : 'Z'));
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
}

// HTTP API Requests Wrapper
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('gamehub_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || `Yêu cầu thất bại (${res.status})`;
      // Handle token expiration or unauthenticated
      if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/me') {
        localStorage.removeItem('gamehub_token');
        localStorage.removeItem('gamehub_user');
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: async (file) => {
    const token = localStorage.getItem('gamehub_token');
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Upload ảnh thất bại.');
    }
    return data;
  }
};

// Global Auth State
const AuthState = {
  getUser: () => {
    try {
      const stored = localStorage.getItem('gamehub_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  setUser: (user, token) => {
    if (user) {
      localStorage.setItem('gamehub_user', JSON.stringify(user));
    }
    if (token) {
      localStorage.setItem('gamehub_token', token);
    }
  },
  clear: () => {
    localStorage.removeItem('gamehub_user');
    localStorage.removeItem('gamehub_token');
  },
  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        AuthState.setUser(res.user);
        return res.user;
      } else {
        AuthState.clear();
        return null;
      }
    } catch {
      AuthState.clear();
      return null;
    }
  }
};

window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.formatRelativeTime = formatRelativeTime;
window.api = api;
window.AuthState = AuthState;
