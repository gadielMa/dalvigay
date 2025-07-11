// Configuración del Sistema VetSystem
const VET_CONFIG = {
    // Información de la clínica
    clinic: {
        name: "CediapVet",
        fullName: "Sistema de Gestión Veterinaria",
        address: "Buenos Aires, Argentina",
        phone: "+54 11 1234 5678",
        email: "info@cediapvet.com",
        logo: "fas fa-heart"
    },
    
    // Configuración de la aplicación
    app: {
        version: "1.0.0",
        theme: "default",
        language: "es",
        timezone: "America/Argentina/Buenos_Aires",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "HH:mm"
    },
    
    // Configuración de inventario
    inventory: {
        lowStockThreshold: 10,
        expiryWarningDays: 30,
        categories: [
            "Medicamentos",
            "Vacunas",
            "Suministros",
            "Alimento",
            "Equipamiento"
        ]
    },
    
    // Configuración de comunicación
    communication: {
        emailEnabled: true,
        smsEnabled: true,
        maxSMSLength: 160,
        emailTemplates: {
            appointment: {
                subject: "Recordatorio de Cita - {petName}",
                body: "Estimado/a {clientName},\n\nEste es un recordatorio de la cita programada para {petName} el {date} a las {time}.\n\nSaludos cordiales,\nEquipo CediapVet"
            },
            vaccination: {
                subject: "Recordatorio de Vacunación - {petName}",
                body: "Estimado/a {clientName},\n\nEs momento de vacunar a {petName}. Por favor, programe una cita.\n\nSaludos cordiales,\nEquipo CediapVet"
            }
        }
    },
    
    // Configuración de reportes
    reports: {
        currency: "ARS",
        fiscalYear: "01/01-31/12",
        backupInterval: 7, // días
        exportFormats: ["PDF", "Excel", "CSV"]
    },
    
    // Configuración de seguridad
    security: {
        sessionTimeout: 30, // minutos
        passwordMinLength: 4,
        requirePasswordChange: false,
        maxLoginAttempts: 3
    },
    
    // Configuración de EMR
    emr: {
        mandatoryFields: [
            "petName",
            "owner",
            "date",
            "diagnosis"
        ],
        appointmentTypes: [
            "Consulta General",
            "Vacunación",
            "Cirugía",
            "Emergencia",
            "Control",
            "Laboratorio"
        ],
        speciesTypes: [
            "Perro",
            "Gato",
            "Ave",
            "Conejo",
            "Hamster",
            "Reptil",
            "Otro"
        ]
    }
};

// Función para obtener configuración
function getConfig(section, key = null) {
    if (key) {
        return VET_CONFIG[section] && VET_CONFIG[section][key];
    }
    return VET_CONFIG[section];
}

// Función para establecer configuración
function setConfig(section, key, value) {
    if (VET_CONFIG[section]) {
        VET_CONFIG[section][key] = value;
        // Guardar en localStorage
        localStorage.setItem('cediapvetConfig', JSON.stringify(VET_CONFIG));
    }
}

// Cargar configuración personalizada desde localStorage
function loadCustomConfig() {
    const savedConfig = localStorage.getItem('cediapvetConfig');
    if (savedConfig) {
        try {
            const customConfig = JSON.parse(savedConfig);
            Object.assign(VET_CONFIG, customConfig);
        } catch (e) {
            console.warn('Error al cargar configuración personalizada:', e);
        }
    }
}

// Cargar configuración al inicio
loadCustomConfig(); 