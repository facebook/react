const config = {
  use: {
    headless: false,
    browserName: 'chromium',
    launchOptions: {
      slowMo: 100,
    },
    viewport: {width: 1000, height: 600},
  },
  workers: 1,
};

module.exports = config;
