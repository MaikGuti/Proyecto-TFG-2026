// src/config/database.js
// Conexión al SQL Server del ERP de TECSOLED — solo lectura

const sql = require('mssql');

const erpConfig = {
  server:   process.env.DB_SERVER,
  port:     parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt:               process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort:      true,
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
    console.log('✅ Conexión a SQL Server ERP establecida');
    console.log(`   Base de datos: ${process.env.DB_NAME} — Servidor: ${process.env.DB_SERVER}`);
    return erpPool;
  } catch (error) {
    console.error('❌ Error al conectar con SQL Server:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!erpPool) throw new Error('La conexión a la base de datos no está inicializada');
  return erpPool;
};

const closeConnection = async () => {
  if (erpPool) {
    await erpPool.close();
    console.log('Conexión a SQL Server cerrada');
  }
};

// activo el modo mock desde index.js cuando no hay credenciales de BD
const enableMockMode = () => { mockMode = true; };
const isMockMode = () => mockMode;

sql.on('error', (err) => {
  console.error('Error en el pool de SQL Server:', err);
});

module.exports = { connectERP, getPool, closeConnection, enableMockMode, isMockMode, sql };
