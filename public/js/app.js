// ==========================================
// API Service - Handles all API calls
// ==========================================

const API_BASE = window.location.origin;

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Get current user profile
function getCurrentUser() {
    const userStr = localStorage.getItem('user_profile');
    return userStr ? JSON.parse(userStr) : null;
}

// Save auth session
function saveAuthSession(session, profile) {
    localStorage.setItem('auth_token', session.access_token);
    localStorage.setItem('user_profile', JSON.stringify(profile));
}

// Clear auth session
function clearAuthSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || 'שגיאה בבקשה');
    }

    return data;
}

// Auth API
const authAPI = {
    async register(userData) {
        const data = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        saveAuthSession(data.session, { ...data.user, role: 'user' });
        return data;
    },

    async login(username, password) {
        const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        saveAuthSession(data.session, data.profile);
        return data;
    },

    async logout() {
        try {
            await apiRequest('/api/auth/logout', { method: 'POST' });
        } finally {
            clearAuthSession();
        }
    },

    async getMe() {
        const data = await apiRequest('/api/auth/me');
        // Update stored profile
        localStorage.setItem('user_profile', JSON.stringify(data.profile));
        return data;
    },

    async updateProfile(updates) {
        const data = await apiRequest('/api/auth/profile', {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        localStorage.setItem('user_profile', JSON.stringify(data.profile));
        return data;
    }
};

// Listings API
const listingsAPI = {
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters);
        return await apiRequest(`/api/listings?${params}`);
    },

    async getById(id) {
        return await apiRequest(`/api/listings/${id}`);
    },

    async create(listingData) {
        // Handle FormData (for file uploads) differently
        if (listingData instanceof FormData) {
            const token = getAuthToken();
            const response = await fetch('/api/listings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: listingData // Don't stringify FormData
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create listing');
            }
            return data;
        }
        
        // Regular JSON request
        return await apiRequest('/api/listings', {
            method: 'POST',
            body: JSON.stringify(listingData)
        });
    },

    async update(id, updates) {
        // Handle FormData (for file uploads) differently
        if (updates instanceof FormData) {
            const token = getAuthToken();
            const response = await fetch(`/api/listings/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: updates // Don't stringify FormData
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update listing');
            }
            return data;
        }
        
        // Regular JSON request
        return await apiRequest(`/api/listings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    },

    async delete(id) {
        return await apiRequest(`/api/listings/${id}`, {
            method: 'DELETE'
        });
    },

    async getMyListings() {
        return await apiRequest('/api/listings/my/listings');
    }
};

// Admin API
const adminAPI = {
    async getStats() {
        return await apiRequest('/api/admin/stats');
    },

    async getPendingVolunteers() {
        return await apiRequest('/api/admin/pending-volunteers');
    },

    async getUsers(filters = {}) {
        const params = new URLSearchParams(filters);
        return await apiRequest(`/api/admin/users?${params}`);
    },

    async approveVolunteer(userId) {
        return await apiRequest(`/api/admin/approve-volunteer/${userId}`, {
            method: 'POST'
        });
    },

    async rejectVolunteer(userId) {
        return await apiRequest(`/api/admin/reject-volunteer/${userId}`, {
            method: 'POST'
        });
    },

    async promoteAdmin(userId) {
        return await apiRequest(`/api/admin/promote-admin/${userId}`, {
            method: 'POST'
        });
    },

    async demoteAdmin(userId) {
        return await apiRequest(`/api/admin/demote-admin/${userId}`, {
            method: 'POST'
        });
    },

    async getAuditLog(limit = 50) {
        return await apiRequest(`/api/admin/audit-log?limit=${limit}`);
    },

    async deleteUser(userId) {
        return await apiRequest(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }
};

// UI Helper Functions
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => successDiv.remove(), 5000);
}

function showLoading(button) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'טוען...';
}

function hideLoading(button) {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
}

// Protected page - redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Redirect if already authenticated
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = '/dashboard';
        return true;
    }
    return false;
}

// Check specific role
function hasRole(roles) {
    const user = getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
}

// Format date to Hebrew
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}
