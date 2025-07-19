// Frontend Configuration for CediapVet
const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080/api'
        : 'https://dalvigay-backend.up.railway.app/api',
    
    // Application Settings
    APP_NAME: 'CediapVet',
    APP_VERSION: '1.0.0',
    
    // Default Settings
    DEFAULT_TIMEZONE: 'America/Argentina/Buenos_Aires',
    
    // Features
    FEATURES: {
        ANALYTICS: true,
        SMS_ENABLED: true,
        EMAIL_ENABLED: true
    }
};

// Make config available globally
window.CONFIG = CONFIG; 