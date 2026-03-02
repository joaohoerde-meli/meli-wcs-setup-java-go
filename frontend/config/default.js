const path = require('path');

module.exports = {
  ragnar: {
    server: {
      port: 8080,
      securePort: 8443,
    },
    basePath: '/wcs-setup/',
  },
  i18n: {
    app: 'wcs-setup',
    srcPath: path.join(__dirname, '/../app'),
    defaultLocale: 'es_AR',
  },
  endpoints: {
    api: 'http://localhost:8080',
  },
  // TODO: minimal config, adjust per best practices: https://furydocs.io/global-theme-web/latest/guide/#/best_practices
  globalTheme: {
    options: {
      name: 'andes_x',
      version: 'latest',
      mode: 'light',
    },
  },
};
