// Vercel Analytics Configuration
// Using dynamic import to avoid module resolution errors
let vercelAnalytics = null;

// Try to load Vercel Analytics dynamically
async function loadVercelAnalytics() {
    try {
        // In production, Vercel Analytics is injected automatically
        if (typeof window !== 'undefined' && window.va) {
            vercelAnalytics = window.va;
            console.log('✅ Vercel Analytics loaded from window.va');
        } else {
            console.log('ℹ️  Vercel Analytics not available');
        }
    } catch (error) {
        console.warn('⚠️  Could not load Vercel Analytics:', error);
    }
}

// Initialize analytics loading
loadVercelAnalytics();

// Custom analytics tracking functions
class CediapVetAnalytics {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        try {
            // Analytics will be initialized when available
            this.initialized = true;
            console.log('✅ CediapVet Analytics initialized');
        } catch (error) {
            console.warn('⚠️  Analytics initialization failed:', error);
        }
    }

    // Track custom events
    trackEvent(eventName, properties = {}) {
        if (!this.initialized) return;
        
        try {
            // Use Vercel Analytics if available
            if (vercelAnalytics && vercelAnalytics.track) {
                vercelAnalytics.track(eventName, properties);
            } else if (typeof window !== 'undefined' && window.va && window.va.track) {
                window.va.track(eventName, properties);
            }
            console.log(`📊 Event tracked: ${eventName}`, properties);
        } catch (error) {
            console.warn('⚠️  Event tracking failed:', error);
        }
    }

    // Track user login
    trackLogin(username, role) {
        this.trackEvent('user_login', {
            username: username,
            role: role,
            timestamp: new Date().toISOString()
        });
    }

    // Track user logout
    trackLogout() {
        this.trackEvent('user_logout', {
            timestamp: new Date().toISOString()
        });
    }

    // Track page views
    trackPageView(page) {
        this.trackEvent('page_view', {
            page: page,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
    }

    // Track medical record actions
    trackMedicalRecord(action, recordId = null) {
        this.trackEvent('medical_record_action', {
            action: action, // 'create', 'update', 'delete', 'view'
            recordId: recordId,
            timestamp: new Date().toISOString()
        });
    }

    // Track inventory actions
    trackInventory(action, itemId = null, itemName = null) {
        this.trackEvent('inventory_action', {
            action: action, // 'create', 'update', 'delete', 'view', 'search'
            itemId: itemId,
            itemName: itemName,
            timestamp: new Date().toISOString()
        });
    }

    // Track client management
    trackClient(action, clientId = null) {
        this.trackEvent('client_action', {
            action: action, // 'create', 'update', 'delete', 'view'
            clientId: clientId,
            timestamp: new Date().toISOString()
        });
    }

    // Track communication events
    trackCommunication(type, method) {
        this.trackEvent('communication_sent', {
            type: type, // 'email', 'sms'
            method: method, // 'appointment_reminder', 'vaccination_reminder', etc.
            timestamp: new Date().toISOString()
        });
    }

    // Track sales
    trackSale(amount, itemCount) {
        this.trackEvent('sale_completed', {
            amount: amount,
            itemCount: itemCount,
            timestamp: new Date().toISOString()
        });
    }

    // Track errors
    trackError(error, context = null) {
        this.trackEvent('error_occurred', {
            error: error.message || error,
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
    }

    // Track feature usage
    trackFeatureUsage(feature, action = 'used') {
        this.trackEvent('feature_usage', {
            feature: feature,
            action: action,
            timestamp: new Date().toISOString()
        });
    }
}

// Create global analytics instance
const analytics = new CediapVetAnalytics();

// Make analytics available globally
window.cediapvetAnalytics = analytics;

// Track initial page load
analytics.trackPageView(window.location.pathname); 