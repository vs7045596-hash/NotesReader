/**
 * inapp-sync-fix.js
 * In-App Browser Compatibility Patch & Storage Safe-Guard
 */
(function () {
    // 1. Safe Storage Polyfill for WebViews with restricted localStorage
    const createInMemoryStorage = () => {
        let store = {};
        return {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => { store[key] = String(value); },
            removeItem: (key) => { delete store[key]; },
            clear: () => { store = {}; }
        };
    };

    try {
        const testKey = '__webview_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
    } catch (e) {
        console.warn('localStorage is restricted in this In-App Browser. Patching with fallback.');
        Object.defineProperty(window, 'localStorage', {
            value: createInMemoryStorage(),
            writable: false
        });
    }

    // 2. Fetch Polyfill for Same-Origin Header Handling in WebViews
    const originalFetch = window.fetch;
    window.fetch = function (resource, init = {}) {
        init.headers = init.headers || {};
        init.credentials = init.credentials || 'same-origin'; // Avoid cross-site cookie blocks
        
        return originalFetch(resource, init).catch((err) => {
            console.error('In-App Fetch fallback triggered:', err);
            throw err;
        });
    };
})();
