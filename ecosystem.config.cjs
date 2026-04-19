module.exports = {
  apps: [
    {
      name: 'abc-bridge',
      script: './src/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        script: './dist/index.js',
        interpreter: 'node',
        interpreter_args: '',
      },
      restart_delay: 3000,
      max_memory_restart: '200M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
