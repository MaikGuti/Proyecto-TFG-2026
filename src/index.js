// src/index.js
// Punto de entrada — arranca Express, monta middlewares y conecta a las BDs

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

const authRoutes        = require('./routes/auth.routes');
const productosRoutes   = require('./routes/productos.routes');
const facturacionRoutes = require('./routes/facturacion.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// --- seguridad ---
// tuve que desactivar contentSecurityPolicy porque helmet bloqueaba
// la carga de Chart.js desde cdnjs — con CSP activo daba error en consola
app.use(helmet({ contentSecurityPolicy: false }));

// sirve los archivos del frontend (html, css, js)
app.use(express.static(path.join(__dirname, '..')));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// --- rutas ---

// endpoint rápido para comprobar que el servidor responde
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    msg: 'servidor funcionando',
    ts: new Date().toISOString(),
  });
});

app.use('/api/auth',        authRoutes);
app.use('/api/productos',   productosRoutes);
app.use('/api/facturacion', facturacionRoutes);

// el middleware de errores tiene que ir siempre al final
app.use(notFound);
app.use(errorHandler);

// --- arranque ---

const start = async () => {
  try {
    initUsuariosDB();
    logger.info('✅ BD de usuarios (SQLite) inicializada');

    if (process.env.DB_SERVER && process.env.DB_USER) {
      await connectERP();
    } else {
      // sin credenciales de BD → modo MOCK con datos de ejemplo
      // útil para desarrollo local y para que el compañero pueda maquetar
      logger.warn('⚠️  Sin credenciales de BD. Modo MOCK activo.');
      enableMockMode();
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Servidor en http://localhost:${PORT}`);
      logger.info(`📋 Entorno: ${process.env.NODE_ENV}`);
    });

  } catch (err) {
    logger.error('Error al arrancar:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await closeConnection(); process.exit(0); });
process.on('SIGINT',  async () => { await closeConnection(); process.exit(0); });

start();
