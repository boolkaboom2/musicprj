module.exports = {
  apps: [{
    name: 'sadovod',
    script: 'npm',
    args: 'run start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1200M',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=1024'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};