const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/Users',
    createProxyMiddleware({
      target: 'https://tasktracker4313.online',
      changeOrigin: true,
      headers: {
        'x-api-key': 'YOUR_API_KEY', // Replace 'YOUR_API_KEY' with your actual API key
      },
    })
  );
};
