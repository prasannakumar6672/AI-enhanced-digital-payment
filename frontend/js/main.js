/* 
 * CyberPay AI - Main JS (Client-Server Integration Edition)
 * Central API Client, Fetch Wrapper, Token Storage, and Authentication Guards
 */
// Central API Client URL.
// Set DEPLOYED_BACKEND_URL to your deployed backend domain (e.g. 'https://your-backend-app.onrender.com') when deploying.
// If empty, it will automatically fallback to localhost:5000 in development, or the current host in production.
const DEPLOYED_BACKEND_URL = ''; 

const API_URL = DEPLOYED_BACKEND_URL 
    ? `${DEPLOYED_BACKEND_URL.replace(/\/$/, '')}/api`
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
        ? 'http://localhost:5000/api'
        : `${window.location.protocol}//${window.location.host}/api`);

class ApiClient {
    getToken() {
        return localStorage.getItem('cyberpay_token');
    }

    setToken(token) {
        localStorage.setItem('cyberpay_token', token);
    }

    getUser() {
        return JSON.parse(localStorage.getItem('cyberpay_user'));
    }

    setUser(user) {
        localStorage.setItem('cyberpay_user', JSON.stringify(user));
    }

    getSecurity() {
        // Return active client-side security rules config
        let sec = localStorage.getItem('cyberpay_security');
        if (!sec) {
            sec = JSON.stringify({
                aiShield: true,
                geoLock: false,
                biometrics: true,
                txnLimit: 1000.00
            });
            localStorage.setItem('cyberpay_security', sec);
        }
        return JSON.parse(sec);
    }

    updateSecurity(secObj) {
        localStorage.setItem('cyberpay_security', JSON.stringify(secObj));
    }

    clearSession() {
        localStorage.removeItem('cyberpay_token');
        localStorage.removeItem('cyberpay_user');
    }

    /**
     * Unified Asynchronous Fetch Request wrapper
     * Attaches headers and catches token expiration
     */
    async fetch(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        
        // Setup headers
        options.headers = options.headers || {};
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
        
        const token = this.getToken();
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                // Catches token expiration or invalid permissions
                if (response.status === 401) {
                    this.clearSession();
                    // Direct to login only if not already on an auth page
                    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
                        window.location.href = 'login.html';
                    }
                }
                throw new Error(result.message || 'API request failed.');
            }

            return result;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message);
            throw error;
        }
    }
}

// Global API Client Instance (Binds to db for compatibility)
const db = new ApiClient();

// Dark mode helper
function applyThemePreference() {
    const isDark = localStorage.getItem('cyberpay_dark_theme') === 'true';
    if (isDark) {
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
    }
}

// Global Toast Alerts
function showToast(message, type = 'success') {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <div class="toast-body">
            <span style="font-size:0.875rem; font-weight:500;">${message}</span>
        </div>
        <i class="fa-solid fa-xmark toast-close"></i>
    `;
    
    container.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Client Session Route Guard
function authGuard() {
    const token = db.getToken();
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
    const isLanding = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('frontend');
    
    if (!token && !isAuthPage && !isLanding) {
        window.location.href = 'login.html';
    } else if (token && isAuthPage) {
        window.location.href = 'dashboard.html';
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    applyThemePreference();
    authGuard();
});
