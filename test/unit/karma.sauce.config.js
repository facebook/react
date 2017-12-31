var webpack = require('webpack')
var base = require('./karma.base.config.js')

base.webpack.plugins = [
  new webpack.DefinePlugin({
    __WEEX__: false,
    'process.env': {
      NODE_ENV: '"development"',
      // sauce lab vms are slow!
      TRANSITION_DURATION: 500,
      TRANSITION_BUFFER: 50
    }
  })
]

/**
 * Having too many tests running concurrently on saucelabs
 * causes timeouts and errors, so we have to run them in
 * smaller batches.
 */

var batches = [
  // the cool kids
  {
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7'
    },
    sl_firefox: {
      base: 'SauceLabs',
      browserName: 'firefox'
    },
    sl_mac_safari: {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.10'
    }
  },
  // ie family
  {
    sl_ie_9: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 7',
      version: '9'
    },
    sl_ie_10: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8',
      version: '10'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    },
    sl_edge: {
      base: 'SauceLabs',
      browserName: 'MicrosoftEdge',
      platform: 'Windows 10'
    }
  },
  // mobile
  {
    sl_ios_safari_9: {
      base: 'SauceLabs',
      browserName: 'iphone',
      version: '10.3'
    },
    sl_android_6_0: {
      base: 'SauceLabs',
      browserName: 'android',
      version: '6.0'
    }
  }
]

module.exports = function (config) {
  var batch = batches[process.argv[4] || 0]

  config.set(Object.assign(base, {
    singleRun: true,
    browsers: Object.keys(batch),
    customLaunchers: batch,
    reporters: process.env.CI
      ? ['dots', 'saucelabs'] // avoid spamming CI output
      : ['progress', 'saucelabs'],
    sauceLabs: {
      testName: 'Vue.js unit tests',
      recordScreenshots: false,
      connectOptions: {
        'no-ssl-bump-domains': 'all' // Ignore SSL error on Android emulator
      },
      build: process.env.CIRCLE_BUILD_NUM || process.env.SAUCE_BUILD_ID || Date.now()
    },
    // mobile emulators are really slow
    captureTimeout: 300000,
    browserNoActivityTimeout: 300000,
    plugins: base.plugins.concat([
      'karma-sauce-launcher'
    ])
  }))
}
