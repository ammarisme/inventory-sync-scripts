module.exports = {
    apps: [
      {
        name: 'stock_sync_prod',
        script: './stock_sync_prod.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
      },
      {
        name: 'orders-sync-from-db',
        script: './orders-sync-from-db.js', // Add your additional script here
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
      }
      // Add more scripts as needed
    ],
  };
  