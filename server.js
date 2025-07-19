const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
// Twilio removido - usando Vonage
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Función para convertir snake_case a camelCase
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Función para convertir objetos de snake_case a camelCase
function convertKeysToCamelCase(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => convertKeysToCamelCase(item));
    }
    
    if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            const camelKey = toCamelCase(key);
            converted[camelKey] = convertKeysToCamelCase(value);
        }
        return converted;
    }
    
    return obj;
}

// Función para convertir camelCase a snake_case
function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Función para convertir objetos de camelCase a snake_case
function convertKeysToSnakeCase(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => convertKeysToSnakeCase(item));
    }
    
    if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            const snakeKey = toSnakeCase(key);
            converted[snakeKey] = convertKeysToSnakeCase(value);
        }
        return converted;
    }
    
    return obj;
}

// Función para convertir texto a formato título
function toTitleCase(str) {
    if (!str || typeof str !== 'string') {
        return str;
    }
    
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

// Función para formatear nombres y direcciones en los datos de clientes
function formatClientData(client) {
    if (!client) return client;
    
    const formatted = { ...client };
    
    // Formatear nombre a título
    if (formatted.name) {
        formatted.name = toTitleCase(formatted.name);
    }
    
    // Formatear dirección a título
    if (formatted.address) {
        formatted.address = toTitleCase(formatted.address);
    }
    
    return formatted;
}

// Función para formatear datos de mascotas
function formatPetData(pet) {
    if (!pet) return pet;
    
    const formatted = { ...pet };
    
    // Formatear nombre de mascota a título
    if (formatted.name) {
        formatted.name = toTitleCase(formatted.name);
    }
    
    // Formatear nombre del cliente a título
    if (formatted.clientName) {
        formatted.clientName = toTitleCase(formatted.clientName);
    }
    
    // Formatear dirección del cliente a título
    if (formatted.clientAddress) {
        formatted.clientAddress = toTitleCase(formatted.clientAddress);
    }
    
    // Formatear raza según la memoria del usuario (CamelCase para razas)
    if (formatted.breed) {
        formatted.breed = formatted.breed.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    return formatted;
}

// Variable para controlar la inicialización
let isInitialized = false;

// Inicializar base de datos para Vercel
async function initForVercel() {
    if (isInitialized) return;
    
    try {
        console.log('🔧 Iniciando inicialización para Vercel...');
        console.log('🔧 Variables de entorno:', {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
            DATABASE_URL: process.env.DATABASE_URL ? 'Configurado' : 'No configurado',
            DB_HOST: process.env.DB_HOST || 'No configurado',
            JWT_SECRET: process.env.JWT_SECRET ? 'Configurado' : 'No configurado'
        });
        
        console.log('🔧 Intentando inicializar base de datos...');
        await initializeDatabase();
        isInitialized = true;
        console.log('✅ Base de datos inicializada para Vercel');
    } catch (error) {
        console.error('❌ Error detallado al inicializar base de datos:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            name: error.name
        });
        
        // En Vercel, intentar continuar sin base de datos para debug
        if (process.env.VERCEL) {
            console.log('⚠️  Continuando sin inicialización completa de BD para debug...');
            isInitialized = true; // Marcar como inicializado para evitar loops
        }
        
        throw error;
    }
}

// Middleware para inicializar en Vercel (DEBE ir antes de las rutas)
app.use(async (req, res, next) => {
    if (process.env.VERCEL && !isInitialized) {
        try {
            await initForVercel();
        } catch (error) {
            console.error('❌ Error al inicializar en Vercel:', error);
            
            // Permitir que el health check funcione incluso si la BD falla
            if (req.path === '/api/health') {
                return next();
            }
            
            return res.status(500).json({ 
                error: 'Error de inicialización del servidor',
                details: {
                    message: error.message,
                    code: error.code,
                    name: error.name
                }
            });
        }
    }
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de la base de datos
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cediapvet_db',
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
        ca: undefined
    } : false
};

// Pool de conexiones
let pool;

// Configuración de nodemailer
const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Twilio removido - usando solo Vonage

// Configuración de Vonage (alternativa gratuita) - v2 API
let vonageClient = null;
try {
    if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
        const Vonage = require('@vonage/server-sdk');
        vonageClient = new Vonage({
            apiKey: process.env.VONAGE_API_KEY,
            apiSecret: process.env.VONAGE_API_SECRET
        });
        console.log('✅ Vonage configurado correctamente');
    } else {
        console.log('⚠️  Vonage no configurado');
    }
} catch (error) {
    console.log('⚠️  Error al configurar Vonage:', error.message);
    vonageClient = null;
}

// Función para enviar email
async function sendEmail(to, subject, html, text) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('⚠️  Configuración de email no encontrada - simulando envío');
            return {
                success: true,
                messageId: 'simulated-' + Date.now(),
                message: 'Email simulado (configuración no disponible)'
            };
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: html,
            text: text
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('✅ Email enviado exitosamente:', info.messageId);
        
        return {
            success: true,
            messageId: info.messageId,
            message: 'Email enviado exitosamente'
        };
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        return {
            success: false,
            error: error.message,
            message: 'Error al enviar email'
        };
    }
}

// Función para validar y formatear números de teléfono
function validateAndFormatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
        return { valid: false, error: 'Número de teléfono requerido' };
    }

    // Limpiar el número
    let cleanNumber = phoneNumber.toString().trim();
    
    // Remover caracteres especiales excepto +
    cleanNumber = cleanNumber.replace(/[^\d+]/g, '');
    
    // Ejemplos de formatos válidos:
    // Argentina: +541123456789, +5491123456789
    // USA: +15551234567
    // España: +34612345678
    
    // Si no tiene código de país, asumir Argentina
    if (!cleanNumber.startsWith('+')) {
        // Remover 0 inicial si existe (formato local argentino)
        if (cleanNumber.startsWith('0')) {
            cleanNumber = cleanNumber.substring(1);
        }
        
        // Si ya tiene código de país 54, solo agregar +
        if (cleanNumber.startsWith('54')) {
            cleanNumber = '+' + cleanNumber;
        } else {
            // Agregar código de país de Argentina
            cleanNumber = '+54' + cleanNumber;
        }
    }
    
    // Validaciones específicas por país
    const digitsOnly = cleanNumber.replace(/[^\d]/g, '');
    
    if (cleanNumber.startsWith('+54')) {
        // Argentina: debe tener 13 dígitos total (+54 + área + número)
        if (digitsOnly.length < 12 || digitsOnly.length > 13) {
            return { 
                valid: false, 
                error: 'Número argentino inválido. Formato esperado: +54911XXXXXXXX o +541123456789',
                formatted: cleanNumber
            };
        }
    } else if (cleanNumber.startsWith('+1')) {
        // USA/Canadá: debe tener 11 dígitos total (+1 + 10 dígitos)
        if (digitsOnly.length !== 11) {
            return { 
                valid: false, 
                error: 'Número de USA/Canadá inválido. Formato esperado: +15551234567',
                formatted: cleanNumber
            };
        }
    } else {
        // Otros países: al menos 10 dígitos
        if (digitsOnly.length < 10) {
            return { 
                valid: false, 
                error: 'Número de teléfono muy corto. Debe tener al menos 10 dígitos.',
                formatted: cleanNumber
            };
        }
    }
    
    return { valid: true, formatted: cleanNumber };
}

// Función para enviar SMS
async function sendSMS(to, message) {
    try {
        // Usar Vonage o simular
        if (vonageClient) {
            return await sendSMSWithVonage(to, message);
        } else {
            console.log('⚠️  Vonage no configurado - simulando envío de SMS');
            return {
                success: true,
                messageId: 'simulated-sms-' + Date.now(),
                message: 'SMS simulado (Vonage no configurado)'
            };
        }
    } catch (error) {
        console.error('❌ Error general al enviar SMS:', error);
        return {
            success: false,
            error: error.message,
            message: 'Error al enviar SMS'
        };
    }
}

// Función para enviar SMS con Vonage
async function sendSMSWithVonage(to, message) {
    try {
        // Validar y formatear el número de teléfono
        const phoneValidation = validateAndFormatPhoneNumber(to);
        
        if (!phoneValidation.valid) {
            console.error('❌ Número de teléfono inválido:', to, '→', phoneValidation.error);
            return {
                success: false,
                error: phoneValidation.error,
                message: `Error: ${phoneValidation.error}`
            };
        }
        
        const phoneNumber = phoneValidation.formatted;

        console.log('📱 Enviando SMS con Vonage a:', phoneNumber);

        try {
            const response = await vonageClient.sms.send({
                to: phoneNumber,
                from: 'CediapVet',
                text: message
            });

            if (response.messages && response.messages[0]) {
                const messageResult = response.messages[0];
                
                if (messageResult.status === '0') {
                    console.log('✅ SMS enviado exitosamente con Vonage:', messageResult['message-id']);
                    return {
                        success: true,
                        messageId: messageResult['message-id'],
                        message: 'SMS enviado exitosamente con Vonage'
                    };
                } else {
                    console.error('❌ Error de Vonage:', messageResult['error-text']);
                    return {
                        success: false,
                        error: messageResult['error-text'],
                        message: `Error al enviar SMS: ${messageResult['error-text']}`
                    };
                }
            } else {
                console.error('❌ Respuesta inesperada de Vonage:', response);
                return {
                    success: false,
                    error: 'Respuesta inesperada del servidor',
                    message: 'Error al enviar SMS: respuesta inesperada'
                };
            }
        } catch (vonageError) {
            console.error('❌ Error de Vonage:', vonageError);
            return {
                success: false,
                error: vonageError.message,
                message: `Error al enviar SMS: ${vonageError.message}`
            };
        }
    } catch (error) {
        console.error('❌ Error general en Vonage:', error);
        return {
            success: false,
            error: error.message,
            message: 'Error al enviar SMS con Vonage'
        };
    }
}

// Función de Twilio removida - usando solo Vonage

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        // Crear pool de conexiones PostgreSQL
        console.log('🔧 Configurando conexión a PostgreSQL...');
        
        if (dbConfig.connectionString) {
            // Usar connectionString si está disponible (preferido para Vercel)
            console.log('🔧 Usando DATABASE_URL para conexión');
            
            // Configuración SSL específica para Supabase (siempre requerida)
            // Bypass SSL verification for development with self-signed certificates
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            
            const sslConfig = process.env.VERCEL ? {
                rejectUnauthorized: false,
                ca: undefined,
                checkServerIdentity: () => undefined,
                secureProtocol: 'TLSv1_2_method'
            } : {
                rejectUnauthorized: false,
                ca: undefined,
                checkServerIdentity: () => undefined,
                secureProtocol: 'TLSv1_2_method' // Supabase requiere SSL incluso en desarrollo
            };
            
            console.log('🔧 Configuración SSL:', sslConfig);
            
            pool = new Pool({
                connectionString: dbConfig.connectionString,
                ssl: sslConfig,
                max: 1, // Limitar conexiones en Vercel
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000
            });
        } else {
            // Usar configuración individual como fallback
            console.log('🔧 Usando configuración individual de BD');
            
            // Usar la configuración SSL del dbConfig (que respeta NODE_ENV)
            const sslConfig = dbConfig.ssl;
            console.log('🔧 Configuración SSL para desarrollo local:', sslConfig);
            
            pool = new Pool({
                host: dbConfig.host,
                port: dbConfig.port,
                user: dbConfig.user,
                password: dbConfig.password,
                database: dbConfig.database,
                ssl: sslConfig,
                max: 10, // Más conexiones para desarrollo local
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000
            });
        }

        // Probar conexión
        console.log('🔧 Probando conexión a PostgreSQL...');
        const client = await pool.connect();
        console.log('✅ Conexión a PostgreSQL establecida exitosamente');
        
        // Probar una query simple
        const testResult = await client.query('SELECT NOW() as current_time');
        console.log('✅ Query de prueba exitosa:', testResult.rows[0]);
        
        client.release();

        // Crear tablas
        await createTables();
        
        console.log('✅ Base de datos inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        
        // En Vercel, no podemos hacer process.exit(), así que lanzamos el error
        if (process.env.VERCEL) {
            throw error;
        } else {
            process.exit(1);
        }
    }
}

// Función para crear las tablas
async function createTables() {
    const client = await pool.connect();
    
    try {
        // Tabla de usuarios
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(50) NOT NULL,
                photo VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear trigger para updated_at en users
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at 
                BEFORE UPDATE ON users 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Tabla de registros médicos
        await client.query(`
            CREATE TABLE IF NOT EXISTS medical_records (
                id SERIAL PRIMARY KEY,
                pet_name VARCHAR(100) NOT NULL,
                owner VARCHAR(100) NOT NULL,
                date DATE NOT NULL,
                diagnosis TEXT NOT NULL,
                treatment TEXT NOT NULL,
                next_appointment DATE,
                applied_medications TEXT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        
        // Agregar columna applied_medications si no existe (para bases de datos existentes)
        await client.query(`
            ALTER TABLE medical_records 
            ADD COLUMN IF NOT EXISTS applied_medications TEXT
        `);

        // Agregar columnas adicionales si no existen
        await client.query(`
            ALTER TABLE medical_records 
            ADD COLUMN IF NOT EXISTS pet_id INT
        `);
        
        await client.query(`
            ALTER TABLE medical_records 
            ADD COLUMN IF NOT EXISTS client_id INT
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_medical_records_updated_at ON medical_records;
            CREATE TRIGGER update_medical_records_updated_at 
                BEFORE UPDATE ON medical_records 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Tabla de inventario
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                stock INT NOT NULL DEFAULT 0,
                min_stock INT NOT NULL DEFAULT 0,
                expiry_date DATE,
                supplier VARCHAR(100),
                barcode VARCHAR(50) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Agregar campo barcode si no existe (para bases de datos existentes)
        await client.query(`
            ALTER TABLE inventory 
            ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) UNIQUE
        `);

        // Agregar campo price si no existe (para bases de datos existentes)
        await client.query(`
            ALTER TABLE inventory 
            ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
            CREATE TRIGGER update_inventory_updated_at 
                BEFORE UPDATE ON inventory 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Tabla de clientes
        await client.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
            CREATE TRIGGER update_clients_updated_at 
                BEFORE UPDATE ON clients 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Tabla de mascotas
        await client.query(`
            CREATE TABLE IF NOT EXISTS pets (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                species VARCHAR(50) NOT NULL,
                breed VARCHAR(100),
                age INT,
                client_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_pets_updated_at ON pets;
            CREATE TRIGGER update_pets_updated_at 
                BEFORE UPDATE ON pets 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Agregar la restricción de clave foránea de medical_records a pets (ahora que pets existe)
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'fk_pet' 
                    AND conrelid = 'medical_records'::regclass
                ) THEN
                    ALTER TABLE medical_records 
                    ADD CONSTRAINT fk_pet
                    FOREIGN KEY (pet_id)
                    REFERENCES pets(id)
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        // Tabla de comunicaciones
        await client.query(`
            CREATE TABLE IF NOT EXISTS communications (
                id SERIAL PRIMARY KEY,
                client_id INT,
                type VARCHAR(10) CHECK (type IN ('email', 'sms')) NOT NULL,
                subject VARCHAR(255),
                message TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_by INT,
                FOREIGN KEY (client_id) REFERENCES clients(id),
                FOREIGN KEY (sent_by) REFERENCES users(id)
            )
        `);

        // Tabla de ventas
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                veterinarian_id INT NOT NULL,
                total_amount DECIMAL(10,2) DEFAULT 0.00,
                total_items INT DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (veterinarian_id) REFERENCES users(id)
            )
        `);

        // Tabla de items de venta
        await client.query(`
            CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                unit_price DECIMAL(10,2) DEFAULT 0.00,
                total_price DECIMAL(10,2) DEFAULT 0.00,
                FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES inventory(id)
            )
        `);

        // Insertar usuarios por defecto
        await insertDefaultUsers(client);
        await insertSampleData(client);

        console.log('✅ Tablas creadas correctamente');
        
    } catch (error) {
        console.error('❌ Error al crear tablas:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Función para insertar usuarios por defecto
async function insertDefaultUsers(client) {
    try {
        const hashedPassword = await bcrypt.hash('3155', 10);
        
        await client.query(`
            INSERT INTO usuarios (username, password, name, role) VALUES
            ('daniel', $1, 'Dr. Daniel Malagrino', 'Veterinario'),
            ('liliana', $2, 'Dra. Liliana Vazquez', 'Veterinaria')
            ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name
        `, [hashedPassword, hashedPassword]);
        
        console.log('✅ Usuarios por defecto insertados');
    } catch (error) {
        console.error('❌ Error al insertar usuarios:', error);
    }
}

// Función para insertar datos de ejemplo
async function insertSampleData(client) {
    try {
        // Verificar si ya hay clientes en la base de datos
        const existingClients = await client.query('SELECT COUNT(*) FROM clients');
        if (existingClients.rows[0].count > 0) {
            console.log('✅ Ya existen clientes en la base de datos, saltando inserción de datos de ejemplo');
            
            // Pero verificar si hay mascotas, y si no, insertar algunas
            const existingPets = await client.query('SELECT COUNT(*) FROM pets');
            if (existingPets.rows[0].count === 0) {
                console.log('📋 No hay mascotas, insertando mascotas de ejemplo...');
                
                // Obtener algunos clientes existentes para asociar mascotas
                const clientsForPets = await client.query('SELECT id, name FROM clients LIMIT 3');
                
                if (clientsForPets.rows.length > 0) {
                    // Insertar mascotas de ejemplo
                    await client.query(`
                        INSERT INTO pets (name, species, breed, age, client_id) VALUES
                        ('Max', 'Perro', 'Golden Retriever', 3, $1),
                        ('Luna', 'Gato', 'Persa', 2, $2),
                        ('Bella', 'Perro', 'Labrador', 5, $1),
                        ('Milo', 'Gato', 'Siamés', 1, $2)
                    `, [clientsForPets.rows[0].id, clientsForPets.rows[1] ? clientsForPets.rows[1].id : clientsForPets.rows[0].id]);
                    
                    console.log('✅ Mascotas de ejemplo insertadas');
                    
                    // También insertar algunos registros médicos para estas mascotas
                    const petsResult = await client.query('SELECT id, name, client_id FROM pets');
                    for (const pet of petsResult.rows) {
                        const clientResult = await client.query('SELECT name FROM clients WHERE id = $1', [pet.client_id]);
                        const clientName = clientResult.rows[0]?.name || 'Cliente desconocido';
                        
                        await client.query(`
                            INSERT INTO medical_records (pet_name, owner, client_id, pet_id, date, diagnosis, treatment, next_appointment, created_by) VALUES
                            ($1, $2, $3, $4, CURRENT_DATE - INTERVAL '30 days', 'Vacunación antirrábica', 'Aplicación de vacuna antirrábica', CURRENT_DATE + INTERVAL '365 days', 1)
                        `, [pet.name, clientName, pet.client_id, pet.id]);
                    }
                    
                    console.log('✅ Registros médicos de ejemplo insertados para mascotas');
                }
            }
            
            return;
        }

        // Insertar clientes de ejemplo y obtener sus IDs
        const clientsResult = await client.query(`
            INSERT INTO clients (name, email, phone, address) VALUES
            ('Juan Pérez', 'juan.perez@email.com', '+1234567890', 'Calle 123, Ciudad'),
            ('María González', 'maria.gonzalez@email.com', '+1234567891', 'Avenida 456, Ciudad')
            RETURNING id, name
        `);

        const clientIds = clientsResult.rows;
        console.log('📋 Clientes insertados:', clientIds);

        // Insertar mascotas de ejemplo usando los IDs reales
        await client.query(`
            INSERT INTO pets (name, species, breed, age, client_id) VALUES
            ('Max', 'Perro', 'Golden Retriever', 3, $1),
            ('Luna', 'Gato', 'Persa', 2, $2)
        `, [clientIds[0].id, clientIds[1].id]);

        // Insertar registros médicos de ejemplo usando los IDs reales
        await client.query(`
            INSERT INTO medical_records (pet_name, owner, client_id, date, diagnosis, treatment, next_appointment, created_by) VALUES
            ('Max', $1, $2, '2024-01-15', 'Vacunación antirrábica', 'Aplicación de vacuna antirrábica', '2025-01-15', 1),
            ('Luna', $3, $4, '2024-01-10', 'Gastritis', 'Dieta blanda y medicación', '2024-01-20', 1)
        `, [clientIds[0].name, clientIds[0].id, clientIds[1].name, clientIds[1].id]);

        // Insertar inventario de ejemplo
        await client.query(`
            INSERT INTO inventory (name, category, stock, min_stock, price, expiry_date, supplier, barcode) VALUES
            ('Vacuna Antirrábica', 'Vacunas', 25, 10, 350.00, '2024-06-30', 'MedVet Supply', '7891234567890'),
            ('Antibiótico Amoxicilina', 'Medicamentos', 5, 15, 125.50, '2024-03-15', 'Farmacia Veterinaria', '7891234567891'),
            ('Jeringa 5ml', 'Suministros', 100, 50, 15.00, '2025-12-31', 'Suministros Médicos', '7891234567892')
            ON CONFLICT (barcode) DO NOTHING
        `);

        console.log('✅ Datos de ejemplo insertados');
    } catch (error) {
        console.error('❌ Error al insertar datos de ejemplo:', error);
    }
}

// Middleware de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`🔐 Verificando autenticación para: ${req.method} ${req.path}`);

    if (!token) {
        console.log('❌ Token no proporcionado');
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'cediapvet_secret_key_2024', (err, user) => {
        if (err) {
            console.log('❌ Token inválido:', err.message);
            return res.status(403).json({ error: 'Token inválido' });
        }
        console.log(`✅ Usuario autenticado: ${user.username}`);
        req.user = user;
        next();
    });
}

// Rutas de la API

// Ruta de debug para verificar estado del servidor
app.get('/api/health', async (req, res) => {
    try {
        const healthCheck = {
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                VERCEL: process.env.VERCEL,
                DATABASE_URL: process.env.DATABASE_URL ? 'Configurado' : 'No configurado',
                DB_HOST: process.env.DB_HOST || 'No configurado'
            },
            database: {
                poolInitialized: !!pool,
                isInitialized: isInitialized
            }
        };

        // Intentar conexión a la base de datos si el pool existe
        if (pool) {
            try {
                const client = await pool.connect();
                const result = await client.query('SELECT NOW() as current_time');
                client.release();
                healthCheck.database.connectionTest = 'SUCCESS';
                healthCheck.database.currentTime = result.rows[0].current_time;
            } catch (dbError) {
                healthCheck.database.connectionTest = 'FAILED';
                healthCheck.database.error = {
                    message: dbError.message,
                    code: dbError.code,
                    name: dbError.name
                };
            }
        } else {
            // Intentar crear una conexión directa para diagnóstico
            healthCheck.database.connectionTest = 'POOL_NOT_INITIALIZED';
            
            if (process.env.DATABASE_URL) {
                try {
                    const { Pool } = require('pg');
                    const testPool = new Pool({
                        connectionString: process.env.DATABASE_URL,
                        ssl: {
                            rejectUnauthorized: false,
                            ca: undefined,
                            checkServerIdentity: () => undefined
                        },
                        max: 1,
                        connectionTimeoutMillis: 5000
                    });
                    
                    const client = await testPool.connect();
                    const result = await client.query('SELECT NOW() as current_time');
                    client.release();
                    await testPool.end();
                    
                    healthCheck.database.directConnectionTest = 'SUCCESS';
                    healthCheck.database.testTime = result.rows[0].current_time;
                } catch (directError) {
                    healthCheck.database.directConnectionTest = 'FAILED';
                    healthCheck.database.directError = {
                        message: directError.message,
                        code: directError.code,
                        name: directError.name
                    };
                }
            }
        }

        res.json(healthCheck);
    } catch (error) {
        res.status(500).json({
            error: 'Health check failed',
            details: {
                message: error.message,
                name: error.name,
                code: error.code
            }
        });
    }
});

// Ruta de login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Verificar que el pool esté disponible
        if (!pool) {
            console.error('❌ Pool de base de datos no inicializado');
            return res.status(500).json({ error: 'Base de datos no disponible' });
        }
        
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM usuarios WHERE username = $1',
            [username]
        );
        client.release();

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'cediapvet_secret_key_2024',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        const userResponse = convertKeysToCamelCase({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                photo: user.photo
            }
        });
        
        res.json(userResponse);

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de registros médicos
app.get('/api/medical-records', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT 
                mr.id,
                mr.pet_name,
                mr.owner,
                mr.date,
                mr.diagnosis,
                mr.treatment,
                mr.next_appointment,
                mr.applied_medications,
                mr.created_by,
                mr.created_at,
                mr.updated_at,
                mr.client_id,
                mr.pet_id,
                c.name as client_name,
                c.email as client_email,
                c.phone as client_phone,
                c.address as client_address,
                p.name as pet_actual_name,
                p.species as pet_species,
                p.breed as pet_breed,
                p.age as pet_age
            FROM medical_records mr
            LEFT JOIN clients c ON mr.client_id = c.id
            LEFT JOIN pets p ON mr.pet_id = p.id
            ORDER BY mr.date DESC
        `);
        client.release();
        
        // Procesar medicamentos aplicados
        const processedRows = result.rows.map(row => {
            if (row.applied_medications) {
                try {
                    row.applied_medications = JSON.parse(row.applied_medications);
                } catch (e) {
                    row.applied_medications = null;
                }
            }
            return row;
        });
        
        const convertedData = convertKeysToCamelCase(processedRows);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al obtener registros médicos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/medical-records', authenticateToken, async (req, res) => {
    try {
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { pet_name: petName, owner_name: ownerName, owner_email: ownerEmail, owner_phone: ownerPhone, date, diagnosis, treatment, next_appointment: nextAppointment, applied_medications: appliedMedications, pet_id: petId } = requestData;
        
        const client = await pool.connect();
        
        try {
            // Iniciar transacción
            await client.query('BEGIN');
            
            let clientId = null;
            
            // Buscar o crear cliente
            const existingClient = await client.query(
                'SELECT id FROM clients WHERE LOWER(name) = LOWER($1)',
                [ownerName]
            );
            
            if (existingClient.rows.length > 0) {
                clientId = existingClient.rows[0].id;
                if (ownerEmail || ownerPhone) {
                    await client.query(
                        'UPDATE clients SET email = COALESCE($1, email), phone = COALESCE($2, phone), updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                        [ownerEmail, ownerPhone, clientId]
                    );
                }
            } else {
                const newClientResult = await client.query(
                    'INSERT INTO clients (name, email, phone) VALUES ($1, $2, $3) RETURNING id',
                    [ownerName, ownerEmail, ownerPhone]
                );
                clientId = newClientResult.rows[0].id;
            }

            let actualPetId = petId; // Usar el petId recibido si existe

            // Si no se proporcionó petId (es decir, el usuario no seleccionó de datalist o es nueva mascota)
            if (!actualPetId) {
                // Buscar si la mascota ya existe para este cliente
                const existingPet = await client.query(
                    'SELECT id FROM pets WHERE LOWER(name) = LOWER($1) AND client_id = $2',
                    [petName, clientId]
                );

                if (existingPet.rows.length > 0) {
                    actualPetId = existingPet.rows[0].id;
                } else {
                    // Mascota no existe, crear una nueva
                    const newPetResult = await client.query(
                        'INSERT INTO pets (name, client_id, species) VALUES ($1, $2, $3) RETURNING id',
                        [petName, clientId, 'Desconocida'] // Especie por defecto si no se proporciona
                    );
                    actualPetId = newPetResult.rows[0].id;
                }
            }
            
            // Crear el registro médico
            const appliedMedicationsJson = appliedMedications && appliedMedications.length > 0 ? JSON.stringify(appliedMedications) : null;
            const result = await client.query(
                'INSERT INTO medical_records (pet_name, owner, client_id, pet_id, date, diagnosis, treatment, next_appointment, applied_medications, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
                [petName, ownerName, clientId, actualPetId, date, diagnosis, treatment, nextAppointment, appliedMedicationsJson, req.user.id]
            );
            
            // Actualizar stock de medicamentos aplicados
            if (appliedMedications && appliedMedications.length > 0) {
                for (const medication of appliedMedications) {
                    await client.query(
                        'UPDATE inventory SET stock = stock - 1 WHERE id = $1 AND stock > 0',
                        [medication.id]
                    );
                }
            }
            
            // Confirmar transacción
            await client.query('COMMIT');
            
            const response = convertKeysToCamelCase({ 
                id: result.rows[0].id, 
                message: 'Registro médico creado exitosamente',
                client_id: clientId,
                pet_id: actualPetId // Devolver el ID de la mascota también
            });
            res.json(response);
            
        } catch (error) {
            // Revertir transacción en caso de error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error al crear registro médico:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/medical-records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { pet_name: petName, owner_name: ownerName, owner_email: ownerEmail, owner_phone: ownerPhone, date, diagnosis, treatment, next_appointment: nextAppointment, applied_medications: appliedMedications, pet_id: petId } = requestData;
        
        console.log(`🔄 Actualizando registro médico ID: ${id}`);
        console.log('📝 Datos recibidos:', { petName, ownerName, ownerEmail, ownerPhone, date, diagnosis, treatment, nextAppointment, petId });
        
        const client = await pool.connect();
        
        try {
            // Iniciar transacción
            await client.query('BEGIN');
            
            let clientId = null;
            
            // Buscar o crear cliente
            const existingClient = await client.query(
                'SELECT id FROM clients WHERE LOWER(name) = LOWER($1)',
                [ownerName]
            );
            
            if (existingClient.rows.length > 0) {
                clientId = existingClient.rows[0].id;
                if (ownerEmail || ownerPhone) {
                    await client.query(
                        'UPDATE clients SET email = COALESCE($1, email), phone = COALESCE($2, phone), updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                        [ownerEmail, ownerPhone, clientId]
                    );
                }
            } else {
                const newClientResult = await client.query(
                    'INSERT INTO clients (name, email, phone) VALUES ($1, $2, $3) RETURNING id',
                    [ownerName, ownerEmail, ownerPhone]
                );
                clientId = newClientResult.rows[0].id;
            }

            let actualPetId = petId; // Usar el petId recibido si existe

            // Si no se proporcionó petId (es decir, el usuario no seleccionó de datalist o es nueva mascota)
            if (!actualPetId) {
                // Buscar si la mascota ya existe para este cliente
                const existingPet = await client.query(
                    'SELECT id FROM pets WHERE LOWER(name) = LOWER($1) AND client_id = $2',
                    [petName, clientId]
                );

                if (existingPet.rows.length > 0) {
                    actualPetId = existingPet.rows[0].id;
                } else {
                    // Mascota no existe, crear una nueva
                    const newPetResult = await client.query(
                        'INSERT INTO pets (name, client_id, species) VALUES ($1, $2, $3) RETURNING id',
                        [petName, clientId, 'Desconocida'] // Especie por defecto si no se proporciona
                    );
                    actualPetId = newPetResult.rows[0].id;
                }
            }
            
            // Actualizar el registro médico
            const appliedMedicationsJson = appliedMedications && appliedMedications.length > 0 ? JSON.stringify(appliedMedications) : null;
            const result = await client.query(
                'UPDATE medical_records SET pet_name = $1, owner = $2, client_id = $3, pet_id = $4, date = $5, diagnosis = $6, treatment = $7, next_appointment = $8, applied_medications = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING id',
                [petName, ownerName, clientId, actualPetId, date, diagnosis, treatment, nextAppointment, appliedMedicationsJson, id]
            );
            
            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Registro médico no encontrado' });
            }
            
            // Confirmar transacción
            await client.query('COMMIT');
            
            console.log(`✅ Registro médico actualizado exitosamente. ID: ${result.rows[0].id}`);
            
            const response = convertKeysToCamelCase({ 
                id: result.rows[0].id, 
                message: 'Registro médico actualizado exitosamente',
                client_id: clientId,
                pet_id: actualPetId // Devolver el ID de la mascota también
            });
            res.json(response);
            
        } catch (error) {
            // Revertir transacción en caso de error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error al actualizar registro médico:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/medical-records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const client = await pool.connect();
        await client.query('DELETE FROM medical_records WHERE id = $1', [id]);
        client.release();

        res.json({ message: 'Registro médico eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar registro médico:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de inventario
app.get('/api/inventory', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM inventory ORDER BY name'
        );
        client.release();
        
        const convertedData = convertKeysToCamelCase(result.rows);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/inventory', authenticateToken, async (req, res) => {
    try {
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { name, category, stock, min_stock: minStock, expiry_date: expiryDate, supplier, barcode } = requestData;
        
        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO inventory (name, category, stock, min_stock, expiry_date, supplier, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [name, category, stock, minStock, expiryDate, supplier, barcode]
        );
        client.release();

        const response = convertKeysToCamelCase({ id: result.rows[0].id, message: 'Producto agregado exitosamente' });
        res.json(response);
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para buscar productos
app.get('/api/inventory/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
        }
        
        const client = await pool.connect();
        const result = await client.query(
            `SELECT * FROM inventory 
             WHERE name ILIKE $1 OR category ILIKE $1 OR supplier ILIKE $1 OR barcode ILIKE $1
             ORDER BY name`,
            [`%${q}%`]
        );
        client.release();
        
        const convertedData = convertKeysToCamelCase(result.rows);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para buscar producto por código de barras
app.get('/api/inventory/barcode/:barcode', authenticateToken, async (req, res) => {
    try {
        const { barcode } = req.params;
        
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM inventory WHERE barcode = $1',
            [barcode]
        );
        client.release();
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const convertedData = convertKeysToCamelCase(result.rows[0]);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al buscar producto por código de barras:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para procesar venta de producto
app.post('/api/inventory/sell', authenticateToken, async (req, res) => {
    try {
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { product_id: productId, quantity = 1 } = requestData;
        
        if (!productId) {
            return res.status(400).json({ error: 'ID del producto requerido' });
        }
        
        if (quantity <= 0) {
            return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
        }
        
        const client = await pool.connect();
        
        // Buscar el producto
        const productResult = await client.query(
            'SELECT * FROM inventory WHERE id = $1',
            [productId]
        );
        
        if (productResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const product = productResult.rows[0];
        
        // Verificar si hay suficiente stock
        if (product.stock < quantity) {
            client.release();
            return res.status(400).json({ 
                error: 'Stock insuficiente', 
                available: product.stock,
                requested: quantity
            });
        }
        
        // Actualizar el stock
        const newStock = product.stock - quantity;
        await client.query(
            'UPDATE inventory SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newStock, product.id]
        );
        
        client.release();
        
        // Verificar si el stock está por debajo del mínimo
        const isLowStock = newStock <= product.min_stock;
        
        const response = convertKeysToCamelCase({
            message: 'Venta procesada exitosamente',
            product: {
                id: product.id,
                name: product.name,
                sold: quantity,
                previous_stock: product.stock,
                new_stock: newStock,
                is_low_stock: isLowStock,
                min_stock: product.min_stock
            }
        });
        res.json(response);
    } catch (error) {
        console.error('Error al procesar venta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/inventory/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const client = await pool.connect();
        await client.query('DELETE FROM inventory WHERE id = $1', [id]);
        client.release();

        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para insertar datos de ejemplo manualmente (solo para desarrollo)
app.post('/api/sample-data', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        
        // Primero, obtener todos los registros médicos existentes
        const medicalRecordsResult = await client.query(`
            SELECT DISTINCT mr.pet_name, mr.owner, mr.client_id, c.name as client_name
            FROM medical_records mr
            LEFT JOIN clients c ON mr.client_id = c.id
            WHERE mr.pet_name IS NOT NULL AND mr.pet_name != ''
        `);
        
        console.log('📋 Registros médicos encontrados:', medicalRecordsResult.rows);
        
        // Crear mascotas basadas en los registros médicos existentes
        let petsCreated = 0;
        for (const record of medicalRecordsResult.rows) {
            // Verificar si la mascota ya existe
            const existingPet = await client.query(`
                SELECT id FROM pets WHERE name = $1 AND client_id = $2
            `, [record.pet_name, record.client_id]);
            
            if (existingPet.rows.length === 0) {
                // Crear la mascota
                await client.query(`
                    INSERT INTO pets (name, species, breed, age, client_id) VALUES
                    ($1, 'Desconocida', 'Desconocida', NULL, $2)
                `, [record.pet_name, record.client_id]);
                
                petsCreated++;
                console.log(`✅ Mascota creada: ${record.pet_name} para ${record.client_name}`);
            }
        }
        
        // Actualizar los registros médicos para que tengan pet_id
        const allPets = await client.query(`
            SELECT id, name, client_id FROM pets
        `);
        
        let recordsUpdated = 0;
        for (const pet of allPets.rows) {
            const updateResult = await client.query(`
                UPDATE medical_records 
                SET pet_id = $1 
                WHERE pet_name = $2 AND client_id = $3 AND pet_id IS NULL
            `, [pet.id, pet.name, pet.client_id]);
            
            if (updateResult.rowCount > 0) {
                recordsUpdated += updateResult.rowCount;
            }
        }
        
        client.release();
        
        res.json({ 
            message: 'Datos sincronizados exitosamente',
            petsCreated: petsCreated,
            recordsUpdated: recordsUpdated,
            totalPets: allPets.rows.length
        });
        
    } catch (error) {
        console.error('Error al sincronizar datos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de mascotas
app.get('/api/pets', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT 
                p.id,
                p.name,
                p.species,
                p.breed,
                p.age,
                p.created_at,
                p.updated_at,
                c.id as client_id,
                c.name as client_name,
                c.email as client_email,
                c.phone as client_phone,
                c.address as client_address
            FROM pets p
            LEFT JOIN clients c ON p.client_id = c.id
            ORDER BY p.name
        `);
        client.release();
        
        // Aplicar conversión a camelCase y formateo de nombres/direcciones
        const convertedData = convertKeysToCamelCase(result.rows);
        const formattedData = convertedData.map(pet => formatPetData(pet));
        
        res.json(formattedData);
    } catch (error) {
        console.error('Error al obtener mascotas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/pets/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { client_id, species, breed, age } = requestData;
        
        console.log(`🔄 Actualizando mascota ID: ${id}`);
        console.log('📝 Datos recibidos:', { client_id, species, breed, age });
        
        const client = await pool.connect();
        const result = await client.query(
            'UPDATE pets SET client_id = $1, species = $2, breed = $3, age = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id',
            [client_id, species, breed, age, id]
        );
        client.release();
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }
        
        console.log(`✅ Mascota actualizada exitosamente. ID: ${result.rows[0].id}`);
        
        const response = convertKeysToCamelCase({ 
            id: result.rows[0].id, 
            message: 'Mascota actualizada exitosamente'
        });
        res.json(response);
        
    } catch (error) {
        console.error('Error al actualizar mascota:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de clientes
app.get('/api/clients', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM clients ORDER BY name'
        );
        client.release();
        
        // Aplicar conversión a camelCase y formateo de nombres/direcciones
        const convertedData = convertKeysToCamelCase(result.rows);
        const formattedData = convertedData.map(client => formatClientData(client));
        
        res.json(formattedData);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
    try {
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { name, email, phone, address } = requestData;
        
        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO clients (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, phone, address]
        );
        client.release();

        // Aplicar conversión a camelCase y formateo de nombres/direcciones
        const convertedClient = convertKeysToCamelCase(result.rows[0]);
        const formattedClient = formatClientData(convertedClient);

        res.json({ 
            message: 'Cliente agregado exitosamente',
            client: formattedClient
        });
    } catch (error) {
        console.error('Error al agregar cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { name, email, phone, address } = requestData;
        
        console.log(`📝 Actualizando cliente con ID: ${id}`);
        
        const client = await pool.connect();
        const result = await client.query(
            'UPDATE clients SET name = $1, email = $2, phone = $3, address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, email, phone, address, id]
        );
        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        console.log(`✅ Cliente actualizado exitosamente. ID: ${result.rows[0].id}`);
        
        // Aplicar conversión a camelCase y formateo de nombres/direcciones
        const convertedClient = convertKeysToCamelCase(result.rows[0]);
        const formattedClient = formatClientData(convertedClient);
        
        res.json({ 
            message: 'Cliente actualizado exitosamente',
            client: formattedClient
        });
    } catch (error) {
        console.error('❌ Error al actualizar cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Eliminando cliente con ID: ${id}`);
        
        const client = await pool.connect();
        const result = await client.query('DELETE FROM clients WHERE id = $1', [id]);
        client.release();

        console.log(`✅ Cliente eliminado exitosamente. Filas afectadas: ${result.rowCount}`);
        
        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error('❌ Error al eliminar cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar configuración de SMS (Vonage)
app.get('/api/sms-status', authenticateToken, async (req, res) => {
    try {
        const status = {
            provider: 'Vonage',
            configured: !!vonageClient,
            apiKey: process.env.VONAGE_API_KEY ? 'Configurado' : 'No configurado',
            apiSecret: process.env.VONAGE_API_SECRET ? 'Configurado' : 'No configurado',
            recommendations: []
        };

        if (!vonageClient) {
            status.recommendations.push('Configura las credenciales de Vonage en las variables de entorno');
            status.recommendations.push('VONAGE_API_KEY y VONAGE_API_SECRET son requeridos');
        } else {
            status.recommendations.push('Vonage configurado correctamente');
            status.recommendations.push('Puedes enviar SMS a cualquier número sin verificación');
        }

        res.json(status);
    } catch (error) {
        console.error('Error al verificar estado de SMS:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para validar números de teléfono
app.post('/api/validate-phone', authenticateToken, async (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({ error: 'Número de teléfono requerido' });
        }
        
        const validation = validateAndFormatPhoneNumber(phone);
        
        res.json({
            original: phone,
            valid: validation.valid,
            formatted: validation.formatted || phone,
            error: validation.error || null,
            examples: {
                argentina: ['+5491123456789', '+541123456789'],
                usa: ['+15551234567'],
                spain: ['+34612345678']
            }
        });
    } catch (error) {
        console.error('Error al validar número de teléfono:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ========================================
// RUTAS API PARA DATOS MIGRADOS (FICHAS)
// ========================================

// Obtener todos los clientes migrados
app.get('/api/migrated/clients', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT 
                "CLI_ID" as id,
                "CLI_NOMBRE" as nombre,
                "CLI_APELLIDO" as apellido,
                "CLI_RAZSOC" as razon_social,
                "CLI_CUIT" as cuit,
                "CLI_TEL1" as telefono,
                "CLI_MAIL" as email,
                "CLI_DOMIC" as domicilio,
                "CLI_LOC" as localidad,
                "CLI_PROV" as provincia,
                "CLI_PAIS" as pais,
                "CLI_FECHA_ALTA" as fecha_alta,
                "CLI_IDCLIENTE" as id_cliente
            FROM "CLIENTES"
            ORDER BY "CLI_NOMBRE", "CLI_APELLIDO"
        `);
        client.release();
        
        const convertedData = convertKeysToCamelCase(result.rows);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al obtener clientes migrados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener todos los pacientes migrados con información del cliente
app.get('/api/migrated/patients', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT 
                p."PAC_ID" as id,
                p."PAC_NOMBRE" as nombre,
                p."PAC_APELLIDO" as apellido,
                p."PAC_NOMCOMP" as nombre_completo,
                p."PAC_FECHA_NAC" as fecha_nacimiento,
                p."PAC_RAZ_ESP" as especie,
                p."PAC_RAZ_NOMBRE" as raza,
                p."PAC_SEXO" as sexo,
                p."PAC_COLOR" as color,
                p."PAC_PESO" as peso,
                p."PAC_CLIENTE" as cliente_id,
                p."PAC_FECHA_ALTA" as fecha_alta,
                p."PAC_FECHA_DES" as estado,
                p."PAC_IDPACIENTE" as id_paciente,
                c."CLI_NOMBRE" as cliente_nombre,
                c."CLI_APELLIDO" as cliente_apellido,
                c."CLI_RAZSOC" as cliente_razon_social,
                c."CLI_TEL1" as cliente_telefono,
                c."CLI_MAIL" as cliente_email,
                c."CLI_DOMIC" as cliente_domicilio,
                c."CLI_LOC" as cliente_localidad
            FROM "PACIENTES" p
            LEFT JOIN "CLIENTES" c ON p."PAC_CLIENTE" = c."CLI_ID"
            ORDER BY p."PAC_NOMBRE", p."PAC_APELLIDO"
        `);
        client.release();
        
        const convertedData = convertKeysToCamelCase(result.rows);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al obtener pacientes migrados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener historial médico completo de un paciente
app.get('/api/migrated/patient/:id/history', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        
        // Obtener información del paciente
        const patientResult = await client.query(`
            SELECT 
                p."PAC_ID" as id,
                p."PAC_NOMBRE" as nombre,
                p."PAC_APELLIDO" as apellido,
                p."PAC_NOMCOMP" as nombre_completo,
                p."PAC_FECHA_NAC" as fecha_nacimiento,
                p."PAC_RAZ_ESP" as especie,
                p."PAC_RAZ_NOMBRE" as raza,
                p."PAC_SEXO" as sexo,
                p."PAC_COLOR" as color,
                p."PAC_PESO" as peso,
                p."PAC_IDPACIENTE" as id_paciente,
                c."CLI_NOMBRE" as cliente_nombre,
                c."CLI_APELLIDO" as cliente_apellido,
                c."CLI_RAZSOC" as cliente_razon_social,
                c."CLI_TEL1" as cliente_telefono,
                c."CLI_MAIL" as cliente_email,
                c."CLI_DOMIC" as cliente_domicilio
            FROM "PACIENTES" p
            LEFT JOIN "CLIENTES" c ON p."PAC_CLIENTE" = c."CLI_ID"
            WHERE p."PAC_ID" = $1
        `, [id]);
        
        if (patientResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        const patient = patientResult.rows[0];
        const pacId = patient.id; // PAC_ID para HCREN
        const pacIdPaciente = patient.id_paciente; // PAC_IDPACIENTE para otros estudios
        
        console.log(`🔍 Buscando historia para paciente ID: ${id}, PAC_ID: ${pacId}, PAC_IDPACIENTE: ${pacIdPaciente}`);
        
        // Obtener historial médico (HCREN)
        const historyResult = await client.query(`
            SELECT 
                "HCR_ID" as id,
                "HCR_FECHA_HC" as fecha,
                "HCR_TITULO" as titulo,
                "HCR_PESO" as peso,
                "HCR_TEMP" as temperatura,
                "HCR_DETALLE" as detalle,
                "HCR_DR" as doctor
            FROM "HCREN"
            WHERE "HCR_HCC_IDPACIENTE" = $1
            ORDER BY "HCR_FECHA_HC" DESC
        `, [pacId]);
        
        // Obtener vacunas
        const vaccinesResult = await client.query(`
            SELECT 
                "VAC_ID" as id,
                "VAC_FVISITA" as fecha_visita,
                "VAC_FPROXIMA" as fecha_proxima,
                "VAC_MARCA" as marca,
                "VAC_CLASE" as clase,
                "VAC_PRECIO" as precio,
                "VAC_DR" as doctor
            FROM "VACUNAS"
            WHERE "VAC_IDPACIENTE" = $1
            ORDER BY "VAC_FVISITA" DESC
        `, [pacIdPaciente]);
        
        // Obtener estudios
        const studiesResult = await client.query(`
            SELECT 
                "EST_ID" as id,
                "EST_FVISITA" as fecha,
                "EST_TITULO" as titulo,
                "EST_DETALLE" as detalle,
                "EST_DR" as doctor
            FROM "ESTUDIOS"
            WHERE "EST_IDPACIENTE" = $1
            ORDER BY "EST_FVISITA" DESC
        `, [pacIdPaciente]);
        
        // Obtener hemogramas
        const hemogramasResult = await client.query(`
            SELECT 
                "HEM_ID" as id,
                "HEM_FVISITA" as fecha,
                "HEM_DR" as doctor,
                "HEM_HEMATIES" as hematies,
                "HEM_HEMOGLOBINA" as hemoglobina,
                "HEM_HEMATOCRITOS" as hematocritos,
                "HEM_LEUCOCITOS" as leucocitos,
                "HEM_OBSER" as observaciones
            FROM "HEMOGRAMAS"
            WHERE "HEM_IDPACIENTE" = $1
            ORDER BY "HEM_FVISITA" DESC
        `, [pacIdPaciente]);
        
        // Obtener ecografías
        const ecografiasResult = await client.query(`
            SELECT 
                "ECO_ID" as id,
                "ECO_FECHA" as fecha,
                "ECO_DR" as doctor,
                "ECO_ESTUDIO" as titulo,
                "ECO_DIAG" as detalle
            FROM "ECOGRAFIAS"
            WHERE "ECO_IDPACIENTE" = $1
            ORDER BY "ECO_FECHA" DESC
        `, [pacIdPaciente]);
        
        // Obtener análisis de orina
        const orinaResult = await client.query(`
            SELECT 
                "ORI_ID" as id,
                "ORI_FECHA" as fecha,
                "ORI_DR" as doctor,
                "ORI_DENSIDAD" as densidad,
                "ORI_PH" as ph,
                "ORI_PROTEINAS" as proteinas,
                "ORI_GLUCOSA" as glucosa,
                "ORI_CETONAS" as cetonas,
                "ORI_SANGRE" as sangre,
                "ORI_LEUCOCITOS" as leucocitos,
                "ORI_NITRIOS" as nitritos,
                "ORI_OBSER2" as observaciones
            FROM "ORINA"
            WHERE "ORI_IDPACIENTE" = $1
            ORDER BY "ORI_FECHA" DESC
        `, [pacIdPaciente]);
        
        // Obtener química sanguínea
        const quimicaResult = await client.query(`
            SELECT 
                "QS_ID" as id,
                "QS_FVISITA" as fecha,
                "QS_DR" as doctor,
                "QS_GLUCOSA2" as glucosa,
                "QS_UREA" as urea,
                "QS_CREATININA" as creatinina,
                "QS_COLESTEROL" as colesterol,
                "QS_TRIGLICERIDOS" as trigliceridos,
                "QS_PROTEINA2" as observaciones
            FROM "QUIMICASANG"
            WHERE "QS_IDPACIENTE" = $1
            ORDER BY "QS_FVISITA" DESC
        `, [pacIdPaciente]);
        
        // Obtener rayos X
        const rayosResult = await client.query(`
            SELECT 
                "RAY_ID" as id,
                "RAY_FVISITA" as fecha,
                "RAY_DR" as doctor,
                "RAY_ESTUDIO" as titulo,
                "RAY_DIAG" as detalle
            FROM "RAYOS"
            WHERE "RAY_IDPACIENTE" = $1
            ORDER BY "RAY_FVISITA" DESC
        `, [pacIdPaciente]);
        
        // Obtener electrocardiograma
        const electroResult = await client.query(`
            SELECT 
                "ELE_ID" as id,
                "ELE_FECHA" as fecha,
                "ELE_DR" as doctor,
                "ELE_ESTUDIO" as titulo,
                "ELE_DIAG" as detalle
            FROM "ELECTROCARDIO"
            WHERE "ELE_IDPACIENTE" = $1
            ORDER BY "ELE_FECHA" DESC
        `, [pacIdPaciente]);
        
        client.release();
        
        console.log(`📊 Resultados encontrados:`);
        console.log(`   - Historia: ${historyResult.rows.length} registros`);
        console.log(`   - Vacunas: ${vaccinesResult.rows.length} registros`);
        console.log(`   - Estudios: ${studiesResult.rows.length} registros`);
        console.log(`   - Hemogramas: ${hemogramasResult.rows.length} registros`);
        console.log(`   - Ecografías: ${ecografiasResult.rows.length} registros`);
        console.log(`   - Análisis de Orina: ${orinaResult.rows.length} registros`);
        console.log(`   - Química Sanguínea: ${quimicaResult.rows.length} registros`);
        console.log(`   - Rayos X: ${rayosResult.rows.length} registros`);
        console.log(`   - Electrocardiograma: ${electroResult.rows.length} registros`);
        
        const response = {
            patient: convertKeysToCamelCase(patient),
            history: convertKeysToCamelCase(historyResult.rows),
            vaccines: convertKeysToCamelCase(vaccinesResult.rows),
            studies: convertKeysToCamelCase(studiesResult.rows),
            hemograms: convertKeysToCamelCase(hemogramasResult.rows),
            ecografias: convertKeysToCamelCase(ecografiasResult.rows),
            orina: convertKeysToCamelCase(orinaResult.rows),
            quimicaSanguinea: convertKeysToCamelCase(quimicaResult.rows),
            rayosX: convertKeysToCamelCase(rayosResult.rows),
            electrocardiograma: convertKeysToCamelCase(electroResult.rows)
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error al obtener historial del paciente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Buscar pacientes por nombre o propietario
app.get('/api/migrated/search', authenticateToken, async (req, res) => {
    try {
        const { q, type } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
        }
        
        const client = await pool.connect();
        let query = '';
        let params = [];
        
        if (type === 'owner') {
            // Buscar por propietario
            query = `
                SELECT 
                    p."PAC_ID" as id,
                    p."PAC_NOMBRE" as nombre,
                    p."PAC_APELLIDO" as apellido,
                    p."PAC_NOMCOMP" as nombre_completo,
                    p."PAC_RAZ_ESP" as especie,
                    p."PAC_RAZ_NOMBRE" as raza,
                    p."PAC_SEXO" as sexo,
                    p."PAC_COLOR" as color,
                    p."PAC_IDPACIENTE" as id_paciente,
                    c."CLI_NOMBRE" as cliente_nombre,
                    c."CLI_APELLIDO" as cliente_apellido,
                    c."CLI_RAZSOC" as cliente_razon_social,
                    c."CLI_TEL1" as cliente_telefono,
                    c."CLI_MAIL" as cliente_email
                FROM "PACIENTES" p
                LEFT JOIN "CLIENTES" c ON p."PAC_CLIENTE" = c."CLI_ID"
                WHERE LOWER(c."CLI_NOMBRE") LIKE LOWER($1) 
                   OR LOWER(c."CLI_APELLIDO") LIKE LOWER($1)
                   OR LOWER(c."CLI_RAZSOC") LIKE LOWER($1)
                ORDER BY p."PAC_NOMBRE", p."PAC_APELLIDO"
            `;
            params = [`%${q}%`];
        } else {
            // Buscar por paciente (por defecto)
            query = `
                SELECT 
                    p."PAC_ID" as id,
                    p."PAC_NOMBRE" as nombre,
                    p."PAC_APELLIDO" as apellido,
                    p."PAC_NOMCOMP" as nombre_completo,
                    p."PAC_RAZ_ESP" as especie,
                    p."PAC_RAZ_NOMBRE" as raza,
                    p."PAC_SEXO" as sexo,
                    p."PAC_COLOR" as color,
                    p."PAC_IDPACIENTE" as id_paciente,
                    c."CLI_NOMBRE" as cliente_nombre,
                    c."CLI_APELLIDO" as cliente_apellido,
                    c."CLI_RAZSOC" as cliente_razon_social,
                    c."CLI_TEL1" as cliente_telefono,
                    c."CLI_MAIL" as cliente_email
                FROM "PACIENTES" p
                LEFT JOIN "CLIENTES" c ON p."PAC_CLIENTE" = c."CLI_ID"
                WHERE LOWER(p."PAC_NOMBRE") LIKE LOWER($1) 
                   OR LOWER(p."PAC_APELLIDO") LIKE LOWER($1)
                   OR LOWER(p."PAC_NOMCOMP") LIKE LOWER($1)
                ORDER BY p."PAC_NOMBRE", p."PAC_APELLIDO"
            `;
            params = [`%${q}%`];
        }
        
        const result = await client.query(query, params);
        client.release();
        
        const convertedData = convertKeysToCamelCase(result.rows);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al buscar pacientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint de prueba para Email
app.post('/api/test-email', authenticateToken, async (req, res) => {
    try {
        const { email, subject, message } = req.body;
        
        if (!email || !subject || !message) {
            return res.status(400).json({ error: 'Email, asunto y mensaje son requeridos' });
        }
        
        console.log('📧 Prueba de Email iniciada:', { email, subject, message });
        console.log('🔧 Configuración Email:', {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            user: process.env.EMAIL_USER ? 'Configurado' : 'No configurado',
            password: process.env.EMAIL_PASSWORD ? 'Configurado' : 'No configurado',
            from: process.env.EMAIL_FROM
        });
        
        const result = await sendEmail(email, subject, message, message);
        
        res.json({
            success: result.success,
            message: result.message,
            error: result.error,
            messageId: result.messageId,
            testInfo: {
                email: email,
                subject: subject,
                message: message,
                emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)
            }
        });
    } catch (error) {
        console.error('Error en prueba de Email:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});

// Endpoint de prueba para SMS
app.post('/api/test-sms', authenticateToken, async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({ error: 'Teléfono y mensaje son requeridos' });
        }
        
        console.log('🧪 Prueba de SMS iniciada:', { phone, message });
        console.log('🔧 Configuración Vonage:', {
            apiKey: process.env.VONAGE_API_KEY ? 'Configurado' : 'No configurado',
            apiSecret: process.env.VONAGE_API_SECRET ? 'Configurado' : 'No configurado',
            vonageClient: vonageClient ? 'Inicializado' : 'No inicializado'
        });
        
        const result = await sendSMS(phone, message);
        
        res.json({
            success: result.success,
            message: result.message,
            error: result.error,
            code: result.code,
            moreInfo: result.moreInfo,
            messageId: result.messageId,
            testInfo: {
                phone: phone,
                message: message,
                vonageConfigured: !!vonageClient,
                provider: 'Vonage'
            }
        });
    } catch (error) {
        console.error('Error en prueba de SMS:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});

// Rutas de comunicaciones
app.get('/api/communications', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT c.*, cl.name as client_name 
            FROM communications c 
            LEFT JOIN clients cl ON c.client_id = cl.id 
            ORDER BY c.sent_at DESC
        `);
        client.release();
        
        const convertedData = convertKeysToCamelCase(result.rows);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al obtener comunicaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/communications', authenticateToken, async (req, res) => {
    try {
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { client_id: clientId, type, subject, message } = requestData;
        
        const client = await pool.connect();
        
        // Obtener información del cliente
        const clientResult = await client.query(
            'SELECT name, email, phone FROM clients WHERE id = $1',
            [clientId]
        );
        
        if (clientResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        const clientData = clientResult.rows[0];
        let sendResult = { success: true, message: 'Comunicación guardada' };
        
        // Enviar email si el tipo es email
        if (type === 'email' && clientData.email) {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
                        <h1>🐾 CediapVet - Clínica Veterinaria</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f8f9fa;">
                        <h2 style="color: #2c3e50;">Hola ${clientData.name},</h2>
                        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
                            <p>Este mensaje fue enviado desde el sistema CediapVet.</p>
                            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                        </div>
                    </div>
                </div>
            `;
            
            sendResult = await sendEmail(
                clientData.email,
                subject,
                emailHtml,
                message
            );
        }
        
        // Enviar SMS si el tipo es SMS
        if (type === 'sms' && clientData.phone) {
            const smsText = `CediapVet: ${message}`;
            
            sendResult = await sendSMS(
                clientData.phone,
                smsText
            );
        }
        
        // Guardar la comunicación en la base de datos
        const result = await client.query(
            'INSERT INTO communications (client_id, type, subject, message, sent_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [clientId, type, subject, message, req.user.id]
        );
        client.release();

        const response = convertKeysToCamelCase({ 
            id: result.rows[0].id, 
            message: sendResult.success ? 'Comunicación enviada exitosamente' : 'Comunicación guardada pero no se pudo enviar',
            email_result: type === 'email' ? sendResult : undefined,
            sms_result: type === 'sms' ? sendResult : undefined,
            client_name: clientData.name,
            client_email: clientData.email,
            client_phone: clientData.phone
        });
        res.json(response);
    } catch (error) {
        console.error('Error al enviar comunicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de ventas
app.get('/api/sales', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT 
                s.id,
                s.sale_date,
                s.total_amount,
                s.total_items,
                s.notes,
                u.name as veterinarian_name,
                u.role as veterinarian_role,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', si.id,
                        'product_name', si.product_name,
                        'quantity', si.quantity,
                        'unit_price', si.unit_price,
                        'total_price', si.total_price
                    )
                ) as items
            FROM sales s
            LEFT JOIN users u ON s.veterinarian_id = u.id
            LEFT JOIN sale_items si ON s.id = si.sale_id
            GROUP BY s.id, s.sale_date, s.total_amount, s.total_items, s.notes, u.name, u.role
            ORDER BY s.sale_date DESC
        `);
        client.release();
        
        const convertedData = convertKeysToCamelCase(result.rows);
        res.json(convertedData);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
    try {
        // Convertir datos de entrada de camelCase a snake_case si es necesario
        const requestData = convertKeysToSnakeCase(req.body);
        const { items, notes = '' } = requestData;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron items para la venta' });
        }
        
        const client = await pool.connect();
        
        try {
            // Iniciar transacción
            await client.query('BEGIN');
            
            // Calcular totales
            let totalAmount = 0;
            let totalItems = 0;
            const processedItems = [];
            
            // Verificar stock y calcular totales
            for (const item of items) {
                // Convertir item de camelCase a snake_case si es necesario
                const itemData = convertKeysToSnakeCase(item);
                const productId = itemData.product_id || itemData.productId;
                
                const productResult = await client.query(
                    'SELECT id, name, stock, price FROM inventory WHERE id = $1',
                    [productId]
                );
                
                if (productResult.rows.length === 0) {
                    throw new Error(`Producto con ID ${productId} no encontrado`);
                }
                
                const product = productResult.rows[0];
                
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
                }
                
                const unitPrice = product.price;
                const totalPrice = unitPrice * item.quantity;
                
                processedItems.push({
                    product_id: product.id,
                    product_name: product.name,
                    quantity: item.quantity,
                    unit_price: unitPrice,
                    total_price: totalPrice
                });
                
                totalAmount += totalPrice;
                totalItems += item.quantity;
            }
            
            // Crear la venta
            const saleResult = await client.query(
                'INSERT INTO sales (veterinarian_id, total_amount, total_items, notes) VALUES ($1, $2, $3, $4) RETURNING id',
                [req.user.id, totalAmount, totalItems, notes]
            );
            
            const saleId = saleResult.rows[0].id;
            
            // Insertar items de venta y actualizar stock
            for (const item of processedItems) {
                // Insertar item de venta
                await client.query(
                    'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
                    [saleId, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price]
                );
                
                // Actualizar stock
                await client.query(
                    'UPDATE inventory SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [item.quantity, item.product_id]
                );
            }
            
            // Confirmar transacción
            await client.query('COMMIT');
            
            const response = convertKeysToCamelCase({
                id: saleId,
                message: 'Venta procesada exitosamente',
                total_amount: totalAmount,
                total_items: totalItems,
                items: processedItems
            });
            res.json(response);
            
        } catch (error) {
            // Revertir transacción en caso de error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error al procesar venta:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});

// Servir archivos estáticos (después de las rutas API)
// En Vercel, los archivos estáticos se sirven automáticamente desde /public
if (!process.env.VERCEL) {
    // Solo en desarrollo local, servir archivos estáticos desde public
    app.use(express.static('public'));
    
    // Ruta para servir archivos estáticos en desarrollo local
    app.get('/', (req, res) => {
        const indexPath = path.resolve(__dirname, 'public', 'index.html');
        res.sendFile(indexPath);
    });
}



// Inicializar servidor solo si no estamos en Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    async function startServer() {
        try {
            await initializeDatabase();
            isInitialized = true;
            
            app.listen(PORT, () => {
                console.log(`🚀 Servidor CediapVet ejecutándose en http://localhost:${PORT}`);
                console.log(`📊 Base de datos: ${dbConfig.database}`);
                console.log(`🔗 Host: ${dbConfig.host}:${dbConfig.port}`);
            });
        } catch (error) {
            console.error('❌ Error al iniciar el servidor:', error);
            process.exit(1);
        }
    }

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
        console.error('❌ Error no capturado:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Promesa rechazada no manejada:', reason);
        process.exit(1);
    });

    // Iniciar servidor
    startServer();
}

// Exportar la app para Vercel
module.exports = app; 