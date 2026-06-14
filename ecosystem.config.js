module.exports = {
  apps: [
    {
      name: 'cyberpay-backend',
      script: './backend/server.js',
      instances: 'max', // Utilizes all available CPU cores for clustering
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        DB_HOST: 'localhost',
        DB_USER: 'root',
        DB_PASS: 'production_db_password',
        DB_NAME: 'cyberpay_db',
        JWT_SECRET: 'pm2_cluster_production_jwt_secret_key_777',
        JWT_EXPIRE: '24h'
      }
    }
  ]
};
