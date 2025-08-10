module.exports = {
  apps: [{
    name: 'warung-fe',
    script: 'serve',
    args: '-s dist -l 3002',
    cwd: '/home/user/warung_fe',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}