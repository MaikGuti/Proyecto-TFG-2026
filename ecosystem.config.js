// ecosystem.config.js
// Configuración de PM2 para despliegue en servidor interno TECSOLED
// Uso:
//   Producción:   pm2 start ecosystem.config.js --env production
//   Desarrollo:   pm2 start ecosystem.config.js --env development
//   Ver logs:     pm2 logs tecsoled-erp
//   Monitorizar:  pm2 monit
//   Reiniciar:    pm2 restart tecsoled-erp
//   Arranque SO:  pm2 startup && pm2 save

module.exports = {
  apps: [
    {
      name: 'tecsoled-erp',
      script: 'src/index.js',

      // Instancias: 1 sola (la app no es stateless pura, pool de BD compartido)
      instances: 1,
      exec_mode: 'fork',

      // Reinicio automático si la app cae
      autorestart: true,
      watch: false,           // Nunca en producción
      max_memory_restart: '300M',

      // Logs
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
