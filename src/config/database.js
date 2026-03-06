// src/config/database.js
// Configuración del pool de conexiones a SQL Server del ERP
// Solo lectura - no se realizan operaciones de escritura

const sql = require('mssql');

const erpConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 15000,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
  },
};

let erpPool = null;
let mockMode = false;

const connectERP = async () => {
  try {
    erpPool = await sql.connect(erpConfig);
    console.log('✅ Conexión a SQL Server ERP establecida correctamente');
    console.log(`   📦 Base de datos: ${process.env.DB_NAME}`);
    console.log(`   🖥️  Servidor: ${process.env.DB_SERVER}`);
    return erpPool;
  } catch (error) {
    console.error('❌ Error al conectar con SQL Server ERP:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!erpPool) {
    throw new Error('La conexión a la base de datos no está inicializada');
  }
  return erpPool;
};

const closeConnection = async () => {
  if (erpPool) {
    await erpPool.close();
    console.log('🔌 Conexión a SQL Server cerrada');
  }
};

/**
 * Activa el modo MOCK (sin BD real).
 * Lo llama src/index.js cuando no hay credenciales configuradas.
 */
const enableMockMode = () => { mockMode = true; };

/**
 * Devuelve true si el servidor está corriendo sin conexión al ERP.
 * Los servicios lo usan para devolver datos de ejemplo.
 */
const isMockMode = () => mockMode;

sql.on('error', (err) => {
  console.error('❌ Error en el pool de SQL Server:', err);
});

module.exports = { connectERP, getPool, closeConnection, enableMockMode, isMockMode, sql };
