// Vercel Serverless Function Entry Point
const app = require('../server.js');

// Handler para Vercel
module.exports = async (req, res) => {
    try {
        // Configurar headers CORS para Vercel
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Manejar preflight requests
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        
        // Procesar la request con Express
        return app(req, res);
    } catch (error) {
        console.error('Error en Vercel handler:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}; 