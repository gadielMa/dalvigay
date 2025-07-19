
// Vercel Analytics Configuration (Browser Compatible)
// Note: This is a simplified version for browser compatibility

// Custom analytics tracking functions
class CediapVetAnalytics {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        try {
            // Initialize analytics (simplified)
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
            console.log(`📊 Event tracked: ${eventName}`, properties);
            // Here you would send to your analytics service
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
