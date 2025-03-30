import { API_URL } from './api';

const TOKEN_KEY = 'auth_token';
const LAST_ACTIVITY_KEY = 'last_activity';
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// Set up activity listeners
document.addEventListener('mousemove', updateLastActivity);
document.addEventListener('keypress', updateLastActivity);
document.addEventListener('click', updateLastActivity);
document.addEventListener('scroll', updateLastActivity);

function updateLastActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

function checkSessionTimeout() {
    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
    const currentTime = Date.now();
    
    if (currentTime - lastActivity > SESSION_TIMEOUT) {
        logout();
    }
}

// Check session timeout every minute
setInterval(checkSessionTimeout, 60 * 1000);

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    updateLastActivity();
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function isAuthenticated() {
    const token = getToken();
    if (!token) return false;
    
    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
    const currentTime = Date.now();
    
    return currentTime - lastActivity <= SESSION_TIMEOUT;
}

export async function logout() {
    try {
        const token = getToken();
        if (token) {
            await fetch(`${API_URL}/users/logout/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeToken();
        window.location.href = '/login';
    }
}

// Initialize last activity timestamp
if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
    updateLastActivity();
} 