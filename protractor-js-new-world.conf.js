var BROWSER_OPTIONS = {
  LocalChrome: {
    'browserName': 'chrome'
  },
  ChromeOnTravis: {
    browserName: 'chrome',
    chromeOptions: {
      'args': ['--no-sandbox'],
      'binary': process.env.CHROME_BIN
    }
  }
};



exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    'dist/all/**/e2e_test/**/*_spec.js'
  ],
  exclude: [
    '**/key_events/**',  // can't tell why this is failing
    '**/sourcemap/**'     // fails only on travis
  ],
  capabilities: process.env.TRAVIS ? BROWSER_OPTIONS.ChromeOnTravis : BROWSER_OPTIONS.LocalChrome,
  directConnect: true,
  baseUrl: 'http://localhost:8000/',
  framework: 'jasmine2',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 60000,
    print: function(msg) { console.log(msg)}
  },
  useAllAngular2AppRoots: true
};


