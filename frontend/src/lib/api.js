import { getToken, logout } from './auth';

export const API_URL = import.meta.env.VITE_API_URL;

async function handleResponse(response) {
    if (response.status === 401) {
        await logout();
        throw new Error('Session expired');
    }
    return response.json();
}

export async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Token ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return handleResponse(response);
}

export const api = {
    // Auth endpoints
    requestOTP: (email) => apiRequest('/users/request_otp/', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),
    verifyOTP: (email, code) => apiRequest('/users/verify_otp/', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
    }),
    logout: () => apiRequest('/users/logout/', {
        method: 'POST',
    }),

    // Secret endpoints
    createSecret: (data) => apiRequest('/secrets/', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    viewSecret: (id, passphrase) => apiRequest(`/secrets/${id}/view_secret/`, {
        method: 'POST',
        body: JSON.stringify({ passphrase }),
    }),
    destroySecret: (id) => apiRequest(`/secrets/${id}/destroy_secret/`, {
        method: 'POST',
    }),
}; 