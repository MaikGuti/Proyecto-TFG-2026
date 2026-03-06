// src/index.js
// Punto de entrada de la aplicación
// Arranca Express, registra middlewares y conecta a la BD

require('dotenv').config();

const path    = require('path');
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const logger = require('./config/logger');
const { connectERP, closeConnection, enableMockMode } = require('./config/database');
const { initDB: initUsuariosDB } = require('./config/database-usuarios');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// Rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const facturacionRoutes = require('./routes/facturacion.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARES DE SEGURIDAD Y PARSEO
// =============================================

// Cabeceras de seguridad HTTP (relajamos CSP para que el frontend cargue Chart.js desde CDN)
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Ficheros estáticos del frontend (login.html, pages/, js/, css/)
app.use(express.static(path.join(__dirname, '..')));

// CORS (para accesos externos a la API)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parseo de JSON
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Logging de peticiones HTTP (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// =============================================
// RUTAS
// =============================================

// Health check - comprueba que el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ Servidor TECSOLED ERP funcionando',
    timestamp: new Date().toISOString(),
    entorno: process.env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/facturacion', facturacionRoutes);

// =============================================
// MANEJO DE ERRORES (siempre al final)
// =============================================
app.use(notFound);
app.use(errorHandler);

// =============================================
// ARRANQUE DEL SERVIDOR
// =============================================

const start = async () => {
  try {
    // Inicializar BD local de usuarios (SQLite)
    initUsuariosDB();
    logger.info('✅ BD de usuarios (SQLite) inicializada');

    // Intentar conectar al ERP
    // Si no hay credenciales aún, lo saltamos con aviso
    if (process.env.DB_SERVER && process.env.DB_USER) {
      await connectERP();
    } else {
      logger.warn('⚠️  Sin credenciales de BD. Arrancando en modo MOCK (datos de ejemplo para diseño)');
      enableMockMode();
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Servidor arrancado en http://localhost:${PORT}`);
      logger.info(`📋 Entorno: ${process.env.NODE_ENV}`);
      logger.info(`🔍 Health check: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    logger.error('❌ Error al arrancar el servidor:', error);
    process.exit(1);
  }
};

// Cierre limpio al apagar el servidor
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recibido. Cerrando servidor...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recibido. Cerrando servidor...');
  await closeConnection();
  process.exit(0);
});

start();
