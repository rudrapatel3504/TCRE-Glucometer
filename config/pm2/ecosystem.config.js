// =========================================================================
// PM2 PROCESS MANAGER CONFIGURATION FOR AWS EC2 DEPLOYMENT
// =========================================================================

module.exports = {
  apps: [
    {
      name: 'tcre-backend-server',
      script: 'npm',
      args: 'run start --workspace=backend',
      instances: 1, // Scalable to 'max' depending on CPU cores
      exec_mode: 'fork', // Or 'cluster' if multiple instances are run
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        LOCAL_DB_DIR: './database/data',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      combine_logs: true,
      time: true
    },
    {
      name: 'tcre-frontend-client',
      script: 'npm',
      args: 'run start --workspace=frontend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:3000',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      combine_logs: true,
      time: true
    }
  ]
};
