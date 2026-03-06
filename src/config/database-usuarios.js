// src/config/database-usuarios.js
// Base de datos SQLite local para gestión de usuarios de la app.
// Independiente del ERP SQL Server — no requiere permisos sobre él.

const path    = require('path');
const fs      = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../../data/usuarios.db');

let db = null;

/**
 * Inicializa la conexión SQLite y crea la tabla si no existe.
 * Se llama una vez al arrancar el servidor.
 */
const initDB = () => {
  // Asegurar que la carpeta data/ existe
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);

  // Activar WAL para mejor rendimiento con lecturas concurrentes
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre       TEXT    NOT NULL,
      email        TEXT    NOT NULL UNIQUE,
      password_hash TEXT   NOT NULL,
      rol          TEXT    NOT NULL CHECK(rol IN ('admin', 'operativo')),
      activo       INTEGER NOT NULL DEFAULT 1,
      creado_en    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  return db;
};

/**
 * Devuelve la instancia activa de la BD.
 * Si no está inicializada, la inicializa en el momento (útil en tests).
 */
const getDB = () => {
  if (!db) initDB();
  return db;
};

module.exports = { initDB, getDB };
