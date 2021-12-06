const config = {
  use: {
    headless: false,
    browserName: 'chromium',
    launchOptions: {
      slowMo: 100,
    },
  },
  workers: 1,
};

module.exports = config;
