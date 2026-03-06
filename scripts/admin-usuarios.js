#!/usr/bin/env node
// scripts/admin-usuarios.js
// CLI para gestionar los usuarios de la aplicación TECSOLED ERP.
//
// USO:
//   node scripts/admin-usuarios.js list
//   node scripts/admin-usuarios.js add --nombre "Ana García" --email "ana@tecsoled.com" --rol admin
//   node scripts/admin-usuarios.js add --nombre "Juan Pérez" --email "juan@tecsoled.com" --rol operativo
//   node scripts/admin-usuarios.js reset-password --email "ana@tecsoled.com" --password "nuevaClave123"
//   node scripts/admin-usuarios.js deactivate --email "juan@tecsoled.com"
//   node scripts/admin-usuarios.js activate --email "juan@tecsoled.com"
//   node scripts/admin-usuarios.js delete --email "juan@tecsoled.com"

require('dotenv').config();

const bcrypt   = require('bcryptjs');
const { initDB, getDB } = require('../src/config/database-usuarios');

const SALT_ROUNDS = 10;

// Colores para la terminal
const c = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
};

const ok  = (msg) => console.log(`${c.green}✔${c.reset}  ${msg}`);
const err = (msg) => console.error(`${c.red}✘${c.reset}  ${msg}`);
const info = (msg) => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`);

// ─── Parsear argumentos simples --key value ───────────────────────────────────
const parseArgs = () => {
  const args = process.argv.slice(2);
  const cmd  = args[0];
  const opts = {};
  for (let i = 1; i < args.length; i += 2) {
    if (args[i] && args[i].startsWith('--')) {
      opts[args[i].slice(2)] = args[i + 1];
    }
  }
  return { cmd, opts };
};

// ─── Comandos ─────────────────────────────────────────────────────────────────

const cmdList = () => {
  const db = getDB();
  const rows = db.prepare('SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY id').all();

  if (rows.length === 0) {
    info('No hay usuarios registrados todavía.');
    return;
  }

  console.log(`\n${c.bold}ID  Nombre                       Email                          Rol         Activo  Creado${c.reset}`);
  console.log('─'.repeat(100));
  rows.forEach(r => {
    const activo = r.activo ? `${c.green}Sí${c.reset}` : `${c.red}No${c.reset}`;
    console.log(
      `${String(r.id).padEnd(4)}${r.nombre.padEnd(29)}${r.email.padEnd(31)}${r.rol.padEnd(12)}${activo.padEnd(18)}${r.creado_en}`
    );
  });
  console.log(`\nTotal: ${rows.length} usuario(s)\n`);
};

const cmdAdd = async ({ nombre, email, rol, password }) => {
  if (!nombre || !email || !rol) {
    err('Faltan parámetros. Uso: add --nombre "Nombre" --email "email@..." --rol admin|operativo');
    process.exit(1);
  }
  if (!['admin', 'operativo'].includes(rol)) {
    err('El rol debe ser "admin" o "operativo".');
    process.exit(1);
  }

  const db = getDB();
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) {
    err(`Ya existe un usuario con el email: ${email}`);
    process.exit(1);
  }

  // Si no se pasa contraseña, generar una temporal
  const pass = password || generarPasswordTemporal();
  const hash = await bcrypt.hash(pass, SALT_ROUNDS);

  db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    VALUES (?, ?, ?, ?)
  `).run(nombre, email, hash, rol);

  ok(`Usuario creado: ${nombre} <${email}> [${rol}]`);
  if (!password) {
    console.log(`\n  ${c.yellow}Contraseña temporal:${c.reset} ${c.bold}${pass}${c.reset}`);
    console.log(`  ${c.yellow}El usuario debe cambiarla en su primer acceso.${c.reset}\n`);
  }
};

const cmdResetPassword = async ({ email, password }) => {
  if (!email || !password) {
    err('Uso: reset-password --email "email@..." --password "nuevaClave"');
    process.exit(1);
  }

  const db = getDB();
  const usuario = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    err(`No se encontró ningún usuario con el email: ${email}`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  db.prepare('UPDATE usuarios SET password_hash = ? WHERE email = ?').run(hash, email);
  ok(`Contraseña actualizada para: ${email}`);
};

const cmdDeactivate = ({ email }) => {
  if (!email) {
    err('Uso: deactivate --email "email@..."');
    process.exit(1);
  }
  const db = getDB();
  const result = db.prepare('UPDATE usuarios SET activo = 0 WHERE email = ?').run(email);
  if (result.changes === 0) {
    err(`No se encontró ningún usuario con el email: ${email}`);
  } else {
    ok(`Usuario desactivado: ${email}`);
  }
};

const cmdActivate = ({ email }) => {
  if (!email) {
    err('Uso: activate --email "email@..."');
    process.exit(1);
  }
  const db = getDB();
  const result = db.prepare('UPDATE usuarios SET activo = 1 WHERE email = ?').run(email);
  if (result.changes === 0) {
    err(`No se encontró ningún usuario con el email: ${email}`);
  } else {
    ok(`Usuario activado: ${email}`);
  }
};

const cmdDelete = ({ email }) => {
  if (!email) {
    err('Uso: delete --email "email@..."');
    process.exit(1);
  }
  const db = getDB();
  const result = db.prepare('DELETE FROM usuarios WHERE email = ?').run(email);
  if (result.changes === 0) {
    err(`No se encontró ningún usuario con el email: ${email}`);
  } else {
    ok(`Usuario eliminado permanentemente: ${email}`);
  }
};

// ─── Utilidades ───────────────────────────────────────────────────────────────

const generarPasswordTemporal = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
};

const mostrarAyuda = () => {
  console.log(`
${c.bold}TECSOLED ERP — Gestión de usuarios${c.reset}

Comandos disponibles:

  ${c.cyan}list${c.reset}
    Muestra todos los usuarios.

  ${c.cyan}add${c.reset} --nombre "Nombre" --email "email@tecsoled.com" --rol admin|operativo [--password "clave"]
    Añade un nuevo usuario. Si no se especifica --password se genera una contraseña temporal.

  ${c.cyan}reset-password${c.reset} --email "email@tecsoled.com" --password "nuevaClave"
    Cambia la contraseña de un usuario.

  ${c.cyan}deactivate${c.reset} --email "email@tecsoled.com"
    Desactiva un usuario (no puede iniciar sesión, pero no se borra).

  ${c.cyan}activate${c.reset} --email "email@tecsoled.com"
    Reactiva un usuario desactivado.

  ${c.cyan}delete${c.reset} --email "email@tecsoled.com"
    Elimina un usuario permanentemente.

Roles:
  ${c.cyan}admin${c.reset}      → Acceso completo + dashboard de facturación (ROL 2)
  ${c.cyan}operativo${c.reset}  → Búsqueda, stock, precios, despieces (ROL 1)
`);
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  initDB();
  const { cmd, opts } = parseArgs();

  switch (cmd) {
    case 'list':           cmdList();                    break;
    case 'add':            await cmdAdd(opts);           break;
    case 'reset-password': await cmdResetPassword(opts); break;
    case 'deactivate':     cmdDeactivate(opts);          break;
    case 'activate':       cmdActivate(opts);            break;
    case 'delete':         cmdDelete(opts);              break;
    default:               mostrarAyuda();               break;
  }
};

main().catch(e => {
  err(e.message);
  process.exit(1);
});
