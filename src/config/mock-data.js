// src/config/mock-data.js
// Datos de ejemplo para modo MOCK (sin conexión al ERP).
// Permite trabajar en maquetación y diseño sin credenciales de BD.

const PRODUCTOS_MOCK = [
  {
    referencia: 'LED-50W-CW',
    nombre: 'Downlight LED 50W Blanco Frío',
    descripcion: 'Downlight empotrable LED 50W, temperatura de color 6000K, ángulo 120°, IP44',
    familia: 'Iluminación LED',
    unidad: 'Ud',
    pvp: 48.90,
    stockAlmacen: 120,
    pendienteRecibir: 50,
    reservada: 10,
    stockMinimo: 20,
    stock: 110,
    stockDisponible: 160,
  },
  {
    referencia: 'LED-30W-WW',
    nombre: 'Panel LED 30W Blanco Cálido',
    descripcion: 'Panel LED cuadrado 600x600mm, 30W, 3000K, CRI>80, driver incluido',
    familia: 'Iluminación LED',
    unidad: 'Ud',
    pvp: 32.50,
    stockAlmacen: 85,
    pendienteRecibir: 0,
    reservada: 5,
    stockMinimo: 15,
    stock: 80,
    stockDisponible: 80,
  },
  {
    referencia: 'TUB-T8-18W',
    nombre: 'Tubo LED T8 18W 120cm',
    descripcion: 'Tubo LED T8 120cm 18W, 4000K luz neutra, compatible con balasto electrónico',
    familia: 'Tubos LED',
    unidad: 'Ud',
    pvp: 8.75,
    stockAlmacen: 300,
    pendienteRecibir: 100,
    reservada: 50,
    stockMinimo: 100,
    stock: 250,
    stockDisponible: 350,
  },
  {
    referencia: 'PRO-100W-RGB',
    nombre: 'Proyector LED 100W RGB Exterior',
    descripcion: 'Proyector LED RGB 100W IP65, para uso exterior, control DMX, 16 millones de colores',
    familia: 'Proyectores',
    unidad: 'Ud',
    pvp: 124.00,
    stockAlmacen: 15,
    pendienteRecibir: 30,
    reservada: 0,
    stockMinimo: 10,
    stock: 15,
    stockDisponible: 45,
  },
  {
    referencia: 'STR-24V-14W',
    nombre: 'Tira LED 24V 14W/m IP20',
    descripcion: 'Tira LED 24V DC, 14W por metro, 4000K, CRI90, corte cada 50mm, rollo 5m',
    familia: 'Tiras LED',
    unidad: 'Rollo',
    pvp: 38.20,
    stockAlmacen: 60,
    pendienteRecibir: 0,
    reservada: 8,
    stockMinimo: 20,
    stock: 52,
    stockDisponible: 52,
  },
];

const ALERTAS_STOCK_MOCK = [
  {
    referencia: 'DRV-150W-24V',
    nombre: 'Driver LED 150W 24V',
    familia: 'Drivers y Fuentes',
    unidad: 'Ud',
    stock: 2,
    stockMinimo: 15,
    deficit: 13,
  },
  {
    referencia: 'CON-DALI-8CH',
    nombre: 'Controlador DALI 8 canales',
    familia: 'Control y Automatización',
    unidad: 'Ud',
    stock: 0,
    stockMinimo: 5,
    deficit: 5,
  },
  {
    referencia: 'LED-10W-GU10',
    nombre: 'Dicroica LED GU10 10W',
    familia: 'Iluminación LED',
    unidad: 'Ud',
    stock: 8,
    stockMinimo: 50,
    deficit: 42,
  },
];

const DESPIECE_MOCK = [
  {
    version: 'v1.0',
    referencia: 'CHI-SMD-5630',
    componente: 'Chip LED SMD 5630',
    cantidad: 60,
    unidad: 'Ud',
    stockDisponible: 2400,
  },
  {
    version: 'v1.0',
    referencia: 'DRV-INT-50W',
    componente: 'Driver interno 50W',
    cantidad: 1,
    unidad: 'Ud',
    stockDisponible: 45,
  },
  {
    version: 'v1.0',
    referencia: 'CUB-ALU-195',
    componente: 'Carcasa aluminio 195mm',
    cantidad: 1,
    unidad: 'Ud',
    stockDisponible: 120,
  },
  {
    version: 'v1.0',
    referencia: 'DIF-PC-OPL',
    componente: 'Difusor policarbonato opal',
    cantidad: 1,
    unidad: 'Ud',
    stockDisponible: 95,
  },
];

const DASHBOARD_MOCK = {
  mes: {
    periodo: 'mes',
    desde: '2026-03-01',
    hasta: '2026-03-31',
    numFacturas: 47,
    totalFacturado: 28450.80,
    ticketMedio: 605.34,
  },
  trimestre: {
    periodo: 'trimestre',
    desde: '2026-01-01',
    hasta: '2026-03-31',
    numFacturas: 142,
    totalFacturado: 87230.50,
    ticketMedio: 614.30,
  },
  anio: {
    periodo: 'anio',
    desde: '2026-01-01',
    hasta: '2026-12-31',
    numFacturas: 142,
    totalFacturado: 87230.50,
    ticketMedio: 614.30,
  },
};

const EVOLUCION_MOCK = [
  { mes: 1,  nombreMes: 'Ene', total: 28100.00, numFacturas: 45 },
  { mes: 2,  nombreMes: 'Feb', total: 30680.70, numFacturas: 50 },
  { mes: 3,  nombreMes: 'Mar', total: 28450.80, numFacturas: 47 },
  { mes: 4,  nombreMes: 'Abr', total: 0,        numFacturas: 0  },
  { mes: 5,  nombreMes: 'May', total: 0,        numFacturas: 0  },
  { mes: 6,  nombreMes: 'Jun', total: 0,        numFacturas: 0  },
  { mes: 7,  nombreMes: 'Jul', total: 0,        numFacturas: 0  },
  { mes: 8,  nombreMes: 'Ago', total: 0,        numFacturas: 0  },
  { mes: 9,  nombreMes: 'Sep', total: 0,        numFacturas: 0  },
  { mes: 10, nombreMes: 'Oct', total: 0,        numFacturas: 0  },
  { mes: 11, nombreMes: 'Nov', total: 0,        numFacturas: 0  },
  { mes: 12, nombreMes: 'Dic', total: 0,        numFacturas: 0  },
];

const COMPARATIVA_MOCK = {
  mes: {
    actual:              { total: 28450.80, numFacturas: 47 },
    anterior:            { total: 30680.70, numFacturas: 50 },
    variacionPorcentaje: -7.3,
    tendencia:           'bajada',
  },
  anio: {
    actual:              { total: 87230.50, numFacturas: 142 },
    anterior:            { total: 95400.00, numFacturas: 158 },
    variacionPorcentaje: -8.6,
    tendencia:           'bajada',
  },
};

module.exports = {
  PRODUCTOS_MOCK,
  ALERTAS_STOCK_MOCK,
  DESPIECE_MOCK,
  DASHBOARD_MOCK,
  EVOLUCION_MOCK,
  COMPARATIVA_MOCK,
};
