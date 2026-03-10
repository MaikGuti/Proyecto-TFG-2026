# TECSOLED ERP - API Backend

API REST para consultas rápidas al ERP de TECSOLED.

## Requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

---

## Modo diseño / maquetación (sin acceso al ERP)

Si no tienes acceso a la red de la empresa, el servidor arranca en **modo MOCK** con datos de ejemplo. Todas las páginas son completamente funcionales.

```bash
# 1. Instalar dependencias
npm install

# 2. Usar el entorno mock (sin credenciales de BD)
cp .env.mock .env

# 3. Arrancar
npm run dev
```

Abre el navegador en **http://localhost:3000/login.html**

**Credenciales demo:**

| Usuario | Email | Contraseña | Acceso |
|---|---|---|---|
| Administrador | `admin@tecsoled.com` | `demo1234` | Todas las páginas + Dashboard |
| Operativo | `operativo@tecsoled.com` | `demo1234` | Búsqueda y detalle de productos |

**Páginas disponibles:**

| Página | URL |
|---|---|
| Login | `/login.html` |
| Búsqueda de productos | `/pages/busqueda.html` |
| Detalle de producto | `/pages/producto.html?ref=LED-50W` |
| Dashboard facturación | `/pages/dashboard.html` (solo admin) |

---

## Instalación con BD real (producción / red empresa)

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar plantilla y rellenar credenciales reales
cp .env.example .env
# Editar .env con IP, usuario y contraseña del SQL Server

# 3. Arrancar en desarrollo
npm run dev

# 4. Arrancar en producción
npm start
```

## Variables de entorno importantes (.env)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_SERVER` | IP del servidor SQL Server | `192.168.1.10` |
| `DB_NAME` | Nombre de la BD del ERP | `TECSOLED_ERP` |
| `DB_USER` | Usuario de solo lectura | `usr_lectura` |
| `DB_PASSWORD` | Contraseña | `*****` |
| `JWT_SECRET` | Clave secreta JWT (mín. 32 chars) | `clave_muy_larga...` |

## Endpoints disponibles

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Datos del usuario actual |

### Productos (todos los roles)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/productos/buscar?q=término` | Búsqueda por ref o nombre |
| GET | `/api/productos/autocompletar?q=led` | Sugerencias autocompletado |
| GET | `/api/productos/:referencia` | Detalle de producto |
| GET | `/api/productos/:referencia/despiece` | Componentes del producto |
| GET | `/api/productos/:referencia/ubicaciones` | Ubicaciones en almacén |
| GET | `/api/productos/ubicaciones-despieces` | Ubicaciones de todos los artículos |

### Facturación (solo ROL admin)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/facturacion/dashboard?periodo=mes` | Dashboard global |
| GET | `/api/facturacion/evolucion?anio=2024` | Evolución mensual |
| GET | `/api/facturacion/comparativa` | Comparativa periodos |

## Roles disponibles

- `operativo` → Acceso a búsqueda y consulta de productos
- `admin` → Todo lo anterior + dashboard de facturación

## Probar el login (datos de prueba)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tecsoled.com","password":"password"}'
```

## Estado actual

- ✅ Estructura y arquitectura completa
- ✅ Autenticación JWT con roles
- ✅ Endpoints definidos y funcionales con datos mock
- ⏳ Conexión real al ERP (pendiente de credenciales)
- ⏳ Queries SQL reales (comentadas en los servicios, listas para activar)

## Estructura del proyecto

```
tecsoled-erp/
├── src/
│   ├── config/
│   │   ├── database.js      # Pool de conexión SQL Server
│   │   └── logger.js        # Sistema de logging
│   ├── controllers/         # Lógica de cada endpoint
│   │   ├── auth.controller.js
│   │   ├── productos.controller.js
│   │   └── facturacion.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js   # JWT + roles
│   │   └── error.middleware.js  # Errores globales
│   ├── routes/              # Definición de rutas
│   │   ├── auth.routes.js
│   │   ├── productos.routes.js
│   │   └── facturacion.routes.js
│   ├── services/            # Lógica de negocio y acceso a BD
│   │   ├── productos.service.js
│   │   └── facturacion.service.js
│   └── index.js             # Punto de entrada
├── logs/                    # Logs generados automáticamente
├── .env                     # Variables de entorno (no subir a git)
├── .env.example             # Plantilla de variables
├── .gitignore
├── package.json
└── README.md
```
