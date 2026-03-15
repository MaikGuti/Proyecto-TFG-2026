// src/config/database-usuarios.js
// BD SQLite para los usuarios de la app — independiente del ERP
// uso better-sqlite3 porque es síncrono y para esto no necesito async

const path    = require('path');
const fs      = require('fs');
const bcrypt  = require('bcryptjs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../../data/usuarios.db');

let db = null;

const initDB = () => {
  // creo la carpeta data/ si no existe
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);

  // WAL mejora mucho el rendimiento cuando hay varias lecturas a la vez
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre        TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      rol           TEXT    NOT NULL CHECK(rol IN ('admin', 'operativo')),
      activo        INTEGER NOT NULL DEFAULT 1,
      creado_en     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // si la tabla está vacía meto dos usuarios de prueba para poder arrancar
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get();
  if (n === 0) {
    const hash   = bcrypt.hashSync('demo1234', 10);
    const insert = db.prepare(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)'
    );
    insert.run('Administrador Demo', 'admin@tecsoled.com',     hash, 'admin');
    insert.run('Operativo Demo',     'operativo@tecsoled.com', hash, 'operativo');
    console.log('Usuarios demo creados — admin@tecsoled.com / operativo@tecsoled.com (demo1234)');
  }

  return db;
};

const getDB = () => {
  if (!db) initDB();
  return db;
};

module.exports = { initDB, getDB };
