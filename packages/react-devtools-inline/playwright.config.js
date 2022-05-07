const config = {
  use: {
    headless: true,
    browserName: 'chromium',
    launchOptions: {
      // This bit of delay gives async React time to render
      // and DevTools operations to be sent across the bridge.
      slowMo: 100,
    },
  },
};

module.exports = config;
