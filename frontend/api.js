// Frontend API Configuration for CediapVet
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api'; // In Vercel, use relative path to serverless functions

// Token management
let authToken = localStorage.getItem('authToken');

// Analytics helper function
function trackAnalytics(eventName, properties = {}) {
    if (window.cediapvetAnalytics) {
        window.cediapvetAnalytics.trackEvent(eventName, properties);
    }
}

// API Helper functions
class CediapVetAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = authToken;
    }

    // Set authorization header
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Handle API responses
    async handleResponse(response) {
        if (!response.ok) {
            let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
            
            // Manejar tokens expirados
            if (response.status === 401 || response.status === 403) {
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const error = await response.json();
                        if (error.error && (error.error.includes('Token inválido') || error.error.includes('jwt expired'))) {
                            console.warn('🔄 Token expirado, limpiando sesión...');
                            this.logout();
                            // Redirigir al login si no estamos ya ahí
                            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                                window.location.href = '/';
                            }
                            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                        }
                        errorMessage = error.error || error.message || errorMessage;
                    }
                } catch (parseError) {
                    // Si no se puede parsear, asumir que es un error de autenticación
                    if (response.status === 401 || response.status === 403) {
                        console.warn('🔄 Error de autenticación, limpiando sesión...');
                        this.logout();
                        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                            window.location.href = '/';
                        }
                        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                    }
                }
            } else {
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const error = await response.json();
                        errorMessage = error.error || error.message || errorMessage;
                    } else {
                        const text = await response.text();
                        if (text.includes('<!DOCTYPE')) {
                            errorMessage = 'Error de autenticación - Token inválido o expirado';
                        } else if (text.trim()) {
                            errorMessage = text;
                        }
                    }
                } catch (parseError) {
                    // Usar el mensaje de error por defecto si no se puede parsear
                    console.warn('No se pudo parsear la respuesta de error:', parseError);
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // Manejar respuesta exitosa
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                return await response.json();
            } catch (parseError) {
                console.warn('No se pudo parsear la respuesta JSON:', parseError);
                return { message: 'Operación completada exitosamente' };
            }
        } else {
            // Si no es JSON, devolver mensaje genérico
            return { message: 'Operación completada exitosamente' };
        }
    }

    // Login
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password })
            });

            const data = await this.handleResponse(response);
            
            // Store token
            this.token = data.token;
            localStorage.setItem('authToken', data.token);
            
            // Track login event
            trackAnalytics('user_login', {
                username: username,
                role: data.user?.role || 'unknown',
                timestamp: new Date().toISOString()
            });
            
            return data;
        } catch (error) {
            console.error('Error en login:', error);
            
            // Track login error
            trackAnalytics('login_error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    // Logout
    logout() {
        // Track logout event
        trackAnalytics('user_logout', {
            timestamp: new Date().toISOString()
        });
        
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    // Medical Records
    async getMedicalRecords() {
        try {
            const response = await fetch(`${this.baseURL}/medical-records`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al obtener registros médicos:', error);
            throw error;
        }
    }

    async createMedicalRecord(record) {
        try {
            const response = await fetch(`${this.baseURL}/medical-records`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(record)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al crear registro médico:', error);
            throw error;
        }
    }

    async updateMedicalRecord(id, record) {
        try {
            console.log('🔄 Actualizando registro médico:', { id, record });
            
            const response = await fetch(`${this.baseURL}/medical-records/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(record)
            });
            
            console.log('📡 Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            const result = await this.handleResponse(response);
            console.log('✅ Resultado procesado:', result);
            
            return result;
        } catch (error) {
            console.error('Error al actualizar registro médico:', error);
            throw error;
        }
    }

    async deleteMedicalRecord(id) {
        try {
            const response = await fetch(`${this.baseURL}/medical-records/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al eliminar registro médico:', error);
            throw error;
        }
    }

    // Inventory
    async getInventory() {
        try {
            const response = await fetch(`${this.baseURL}/inventory`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al obtener inventario:', error);
            throw error;
        }
    }

    async createInventoryItem(item) {
        try {
            const response = await fetch(`${this.baseURL}/inventory`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(item)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al crear item de inventario:', error);
            throw error;
        }
    }

    async deleteInventoryItem(id) {
        try {
            const response = await fetch(`${this.baseURL}/inventory/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al eliminar item de inventario:', error);
            throw error;
        }
    }

    async searchInventory(query) {
        try {
            const response = await fetch(`${this.baseURL}/inventory/search?q=${encodeURIComponent(query)}`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al buscar en inventario:', error);
            throw error;
        }
    }

    async getProductByBarcode(barcode) {
        try {
            const response = await fetch(`${this.baseURL}/inventory/barcode/${barcode}`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al buscar producto por código de barras:', error);
            throw error;
        }
    }

    async processSale(productId, quantity = 1) {
        try {
            const response = await fetch(`${this.baseURL}/inventory/sell`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ productId, quantity })
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al procesar venta:', error);
            throw error;
        }
    }

    // Pets
    async getPets() {
        try {
            const response = await fetch(`${this.baseURL}/pets`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al obtener mascotas:', error);
            throw error;
        }
    }

    async updatePet(id, petData) {
        try {
            const response = await fetch(`${this.baseURL}/pets/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(petData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al actualizar mascota:', error);
            throw error;
        }
    }

    // Clients
    async getClients() {
        try {
            const response = await fetch(`${this.baseURL}/clients`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            throw error;
        }
    }

    async createClient(clientData) {
        try {
            const response = await fetch(`${this.baseURL}/clients`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(clientData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al crear cliente:', error);
            throw error;
        }
    }

    async updateClient(id, clientData) {
        try {
            const response = await fetch(`${this.baseURL}/clients/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(clientData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            throw error;
        }
    }

    async deleteClient(id) {
        try {
            const response = await fetch(`${this.baseURL}/clients/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            throw error;
        }
    }

    // Communications
    async getCommunications() {
        try {
            const response = await fetch(`${this.baseURL}/communications`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al obtener comunicaciones:', error);
            throw error;
        }
    }

    async createCommunication(communication) {
        try {
            const response = await fetch(`${this.baseURL}/communications`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(communication)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al crear comunicación:', error);
            throw error;
        }
    }

    async testSMS(phone, message) {
        try {
            const response = await fetch(`${this.baseURL}/test-sms`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ phone, message })
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al enviar SMS de prueba:', error);
            throw error;
        }
    }

    async testEmail(email, subject, message) {
        try {
            const response = await fetch(`${this.baseURL}/test-email`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, subject, message })
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al enviar email de prueba:', error);
            throw error;
        }
    }

    // Sales
    async getSales() {
        try {
            const response = await fetch(`${this.baseURL}/sales`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al obtener ventas:', error);
            throw error;
        }
    }

    async createSale(items, notes = '') {
        try {
            const response = await fetch(`${this.baseURL}/sales`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ items, notes })
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al crear venta:', error);
            throw error;
        }
    }

    // Sample Data
    async insertSampleData() {
        try {
            const response = await fetch(`${this.baseURL}/sample-data`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al insertar datos de ejemplo:', error);
            throw error;
        }
    }

    // ========================================
    // DATOS MIGRADOS (FICHAS)
    // ========================================

    // Obtener todos los clientes migrados
    async getMigratedClients() {
        try {
            const response = await fetch(`${this.baseURL}/migrated/clients`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al obtener clientes migrados:', error);
            throw error;
        }
    }

    // Obtener todos los pacientes migrados
    async getMigratedPatients() {
        try {
            console.log('🔄 API: Iniciando petición a /migrated/patients');
            console.log('🔄 API: URL:', `${this.baseURL}/migrated/patients`);
            console.log('🔄 API: Token:', this.token ? 'Presente' : 'Ausente');
            
            const headers = this.getHeaders();
            console.log('🔄 API: Headers:', headers);
            
            // Crear un AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('⏰ API: Timeout de 30 segundos alcanzado');
                controller.abort();
            }, 30000); // 30 segundos timeout
            
            const response = await fetch(`${this.baseURL}/migrated/patients`, {
                headers: headers,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('🔄 API: Respuesta recibida');
            console.log('🔄 API: Status:', response.status);
            console.log('🔄 API: StatusText:', response.statusText);
            console.log('🔄 API: OK:', response.ok);
            
            if (!response.ok) {
                console.error('❌ API: Respuesta no OK');
                const text = await response.text();
                console.error('❌ API: Texto de respuesta:', text);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ API: Datos procesados exitosamente');
            console.log('✅ API: Cantidad de registros:', result.length);
            console.log('✅ API: Primeros 3 registros:', result.slice(0, 3));
            
            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ API: Petición cancelada por timeout');
                throw new Error('La petición tardó demasiado tiempo. Por favor, verifica tu conexión.');
            }
            console.error('❌ API: Error al obtener pacientes migrados:', error);
            console.error('❌ API: Stack trace:', error.stack);
            throw error;
        }
    }

    // Obtener historial completo de un paciente
    async getPatientHistory(patientId) {
        try {
            const response = await fetch(`${this.baseURL}/migrated/patient/${patientId}/history`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al obtener historial del paciente:', error);
            throw error;
        }
    }

    // Buscar pacientes por nombre o propietario
    async searchMigratedPatients(query, type = 'pet') {
        try {
            const response = await fetch(`${this.baseURL}/migrated/search?q=${encodeURIComponent(query)}&type=${type}`, {
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error al buscar pacientes migrados:', error);
            throw error;
        }
    }

    // Funciones adicionales para obtener datos específicos de estudios médicos
    // (Estas funciones retornan arrays vacíos por ahora, pero están preparadas para futuros endpoints)
    
    async getPatientEcografias(patientId) {
        try {
            // Por ahora retornamos array vacío, pero se puede implementar endpoint específico
            console.log(`🔄 Obteniendo ecografías para paciente ${patientId}`);
            return [];
        } catch (error) {
            console.error('Error al obtener ecografías:', error);
            return [];
        }
    }

    async getPatientOrina(patientId) {
        try {
            // Por ahora retornamos array vacío, pero se puede implementar endpoint específico
            console.log(`🔄 Obteniendo análisis de orina para paciente ${patientId}`);
            return [];
        } catch (error) {
            console.error('Error al obtener análisis de orina:', error);
            return [];
        }
    }

    async getPatientQuimicaSang(patientId) {
        try {
            // Por ahora retornamos array vacío, pero se puede implementar endpoint específico
            console.log(`🔄 Obteniendo química sanguínea para paciente ${patientId}`);
            return [];
        } catch (error) {
            console.error('Error al obtener química sanguínea:', error);
            return [];
        }
    }

    async getPatientRayos(patientId) {
        try {
            // Por ahora retornamos array vacío, pero se puede implementar endpoint específico
            console.log(`🔄 Obteniendo rayos X para paciente ${patientId}`);
            return [];
        } catch (error) {
            console.error('Error al obtener rayos X:', error);
            return [];
        }
    }

    async getPatientElectrocardio(patientId) {
        try {
            // Por ahora retornamos array vacío, pero se puede implementar endpoint específico
            console.log(`🔄 Obteniendo electrocardiograma para paciente ${patientId}`);
            return [];
        } catch (error) {
            console.error('Error al obtener electrocardiograma:', error);
            return [];
        }
    }
}

// Create global API instance
const api = new CediapVetAPI();

// Function to clear expired tokens
function clearExpiredTokens() {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp < currentTime) {
                console.log('🔄 Token expirado, limpiando...');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.warn('Error al verificar token:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
        }
    }
}

// Clear expired tokens on page load
clearExpiredTokens(); 