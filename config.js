// Configuration for frontend
const CONFIG = {
    // Backend URLs
    BACKEND_URL: {
        development: 'http://localhost:5000',
        production: 'https://backend-55qrj8nmu-aditya-bathlas-projects.vercel.app'
    },
    
    // Get current backend URL based on environment
    getBackendUrl() {
        // Auto-detect if running locally or on production
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('127.0.0.1') ||
                       window.location.hostname.includes('5500') ||
                       window.location.hostname.includes('5502');
        
        return isLocal ? this.BACKEND_URL.development : this.BACKEND_URL.production;
    }
};

// Make config globally available
window.CONFIG = CONFIG;