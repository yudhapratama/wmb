module.exports = {
  apps: [{
    name: 'warung-fe',
    script: 'npx',
    args: 'serve -s dist -p 3000',
    cwd: '/Volumes/Curiosity/PROJECT/warung/warung_fe',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}