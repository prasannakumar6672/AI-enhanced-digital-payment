/* 
 * CyberPay AI - Client Environment Configuration Manager
 * Handles .env variable bindings and dynamic API base URL resolution
 */

(function () {
    // Default Environment Variable Fallbacks
    const DEFAULT_PORT = 5000;
    const DEFAULT_HOST = 'localhost';

    /**
     * Resolves API base URL dynamically based on environment configuration,
     * localStorage overrides, and network host metadata.
     */
    function resolveApiBaseUrl() {
        // 1. Check for manual runtime override in localStorage
        const customUrl = localStorage.getItem('CYBERPAY_API_BASE_URL');
        if (customUrl) {
            return customUrl.replace(/\/$/, '');
        }

        // 2. Check if window.ENV was pre-injected or defined
        if (window.ENV && window.ENV.API_BASE_URL) {
            return window.ENV.API_BASE_URL.replace(/\/$/, '');
        }

        // 3. Auto-detect host location for production / local server deployment
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;

        // File protocol fallback or standard local dev fallback
        if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
            const targetPort = port === '5000' || !port ? '5000' : '5000';
            return `http://${hostname || DEFAULT_HOST}:${targetPort}/api`;
        }

        // Production web server origin fallback
        return `${protocol}//${window.location.host}/api`;
    }

    // Initialize Global Environment Configuration
    window.ENV = Object.assign({
        API_BASE_URL: resolveApiBaseUrl(),
        APP_NAME: 'CyberPay AI',
        VERSION: '1.0.0'
    }, window.ENV || {});

    console.log(`[CyberPay AI Config] Connected API Endpoint: ${window.ENV.API_BASE_URL}`);
})();
