module.exports = {
  apps: [
    {
      name: 'bvpindia-backend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 5000',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'bvp-exam-backend-dev',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 5001',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      }
    }
  ]
}
