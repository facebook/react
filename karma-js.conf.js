var browserProvidersConf = require('./browser-providers.conf.js');
var internalAngularReporter = require('./tools/karma/reporter.js');

// Karma configuration
// Generated on Thu Sep 25 2014 11:52:02 GMT-0700 (PDT)
module.exports = function(config) {
  config.set({

    frameworks: ['jasmine'],

    files: [
      // Sources and specs.
      // Loaded through the System loader, in `test-main.js`.
      {pattern: 'dist/all/@angular/**/*.js', included: false, watched: true},

      'node_modules/es6-shim/es6-shim.js',
      // include Angular v1 for upgrade module testing
      'node_modules/angular/angular.min.js',

      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/long-stack-trace-zone.js',
      'node_modules/zone.js/dist/jasmine-patch.js',
      'node_modules/zone.js/dist/async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',

      // Including systemjs because it defines `__eval`, which produces correct stack traces.
      'shims_for_IE.js',
      'node_modules/systemjs/dist/system.src.js',
      {pattern: 'node_modules/rxjs/**', included: false, watched: false, served: true},
      'node_modules/reflect-metadata/Reflect.js',
      'tools/build/file2modulename.js',
      'test-main.js',
      {pattern: 'dist/all/empty.*', included: false, watched: false},
      {pattern: 'modules/@angular/platform-browser/test/static_assets/**', included: false, watched: false},
      {pattern: 'modules/@angular/platform-browser/test/browser/static_assets/**', included: false, watched: false}
    ],

    exclude: [
      'dist/all/@angular/**/e2e_test/**',
      'dist/all/@angular/examples/**',
      'dist/all/@angular/compiler-cli/**',
      'dist/all/angular1_router.js',
      'dist/all/@angular/platform-browser/testing/e2e_util.js'
    ],

    customLaunchers: browserProvidersConf.customLaunchers,

    plugins: [
      'karma-jasmine',
      'karma-browserstack-launcher',
      'karma-sauce-launcher',
      'karma-chrome-launcher',
      'karma-sourcemap-loader',
      internalAngularReporter
    ],

    preprocessors: {
      '**/*.js': ['sourcemap']
    },

    reporters: ['internal-angular'],
    sauceLabs: {
      testName: 'Angular2',
      retryLimit: 3,
      startConnect: false,
      recordVideo: false,
      recordScreenshots: false,
      options: {
        'selenium-version': '2.53.0',
        'command-timeout': 600,
        'idle-timeout': 600,
        'max-duration': 5400
      }
    },

    browserStack: {
      project: 'Angular2',
      startTunnel: false,
      retryLimit: 3,
      timeout: 600,
      pollingTimeout: 10000
    },

    browsers: ['Chrome'],

    port: 9876,
    captureTimeout: 60000,
    browserDisconnectTimeout : 60000,
    browserDisconnectTolerance : 3,
    browserNoActivityTimeout : 60000,
  });

  if (process.env.TRAVIS) {
    var buildId = 'TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')';
    if (process.env.CI_MODE.startsWith('saucelabs')) {
      config.sauceLabs.build = buildId;
      config.sauceLabs.tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;

      // TODO(mlaval): remove once SauceLabs supports websockets.
      // This speeds up the capturing a bit, as browsers don't even try to use websocket.
      console.log('>>>> setting socket.io transport to polling <<<<');
      config.transports = ['polling'];
    }

    if (process.env.CI_MODE.startsWith('browserstack')) {
      config.browserStack.build = buildId;
      config.browserStack.tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;
    }
  }
};
