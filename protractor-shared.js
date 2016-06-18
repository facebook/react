var fs = require('fs-extra');

var argv = require('yargs')
    .usage('Angular e2e/perf test options.')
    .options({
      'sample-size': {
        describe: 'Used for perf: sample size.',
        default: 20
      },
      'force-gc': {
        describe: 'Used for perf: force gc.',
        default: false,
        type: 'boolean'
      },
      'benchmark': {
        describe: 'If true, run only the performance benchmarks. If false, run only the e2e tests.',
        default: false
      },
      'dryrun': {
        describe: 'If true, only run performance benchmarks once.',
        default: false
      },
      'browsers': {
        describe: 'Comma separated list of preconfigured browsers to use.',
        default: 'ChromeDesktop'
      },
      'spec': {
        describe: 'Comma separated file patterns to test. By default, globs all test/perf files.',
        default: false
      }
    })
    .help('ng-help')
    .wrap(40)
    .argv

var browsers = argv['browsers'].split(',');

var CHROME_OPTIONS = {
  'args': ['--js-flags=--expose-gc'],
  'perfLoggingPrefs': {
    'traceCategories': 'v8,blink.console,devtools.timeline,disabled-by-default-devtools.timeline'
  }
};

var CHROME_MOBILE_EMULATION = {
  // Can't use 'deviceName':'Google Nexus 7 2'
  // as this would yield wrong orientation,
  // so we specify facts explicitly
  'deviceMetrics': {
    'width': 600,
    'height': 960,
    'pixelRatio': 2
  }
};

var BROWSER_CAPS = {
  Dartium: {
    name: 'Dartium',
    browserName: 'chrome',
    chromeOptions: mergeInto(CHROME_OPTIONS, {
      'mobileEmulation': CHROME_MOBILE_EMULATION,
      'binary': process.env.DARTIUM_BIN
    }),
    loggingPrefs: {
      performance: 'ALL',
      browser: 'ALL'
    }
  },
  ChromeDesktop: {
    browserName: 'chrome',
    chromeOptions: mergeInto(CHROME_OPTIONS, {
      // TODO(tbosch): when we are using mobile emulation on
      // chrome 44.0 beta, clicks are no more working.
      // see https://github.com/angular/angular/issues/2309
      // 'mobileEmulation': CHROME_MOBILE_EMULATION
    }),
    loggingPrefs: {
      performance: 'ALL',
      browser: 'ALL'
    }
  },
  ChromeOnTravis: {
    browserName: 'chrome',
    chromeOptions: mergeInto({
      'args': ['--no-sandbox', '--js-flags=--expose-gc'],
      'binary': process.env.CHROME_BIN
    }, CHROME_OPTIONS),
    loggingPrefs: {
      performance: 'ALL',
      browser: 'ALL'
    }
  },
  ChromeAndroid: {
    browserName: 'chrome',
    chromeOptions: mergeInto(CHROME_OPTIONS, {
      'androidPackage': 'com.android.chrome',
    }),
    loggingPrefs: {
      performance: 'ALL',
      browser: 'ALL'
    }
  },
  IPhoneSimulator: {
    browserName: 'MobileSafari',
    simulator: true,
    CFBundleName: 'Safari',
    device: 'iphone',
    instruments: 'true',
    loggingPrefs: {
      performance: 'ALL',
      browser: 'ALL'
    }
  },
  IPadNative: {
    browserName: 'MobileSafari',
    simulator: false,
    CFBundleName: 'Safari',
    device: 'ipad',
    loggingPrefs: {
      performance: 'ALL',
      browser: 'ALL'
    }
  }
};

var getTestFiles = function (benchmark, spec) {
  var specFiles = [];
  var perfFiles = [];
  if (spec.length) {
    spec.split(',').forEach(function (name) {
      specFiles.push('dist/js/cjs/**/e2e_test/' + name)
      perfFiles.push('dist/js/cjs/**/e2e_test/' + name)
    });
  } else {
    specFiles.push('dist/js/cjs/**/e2e_test/**/*_spec.js');
    perfFiles.push('dist/js/cjs/**/e2e_test/**/*_perf.js');
  }
  return benchmark ? perfFiles : specFiles;
};

var config = exports.config = {
  onPrepare: function() {
    // TODO(juliemr): remove this hack and use the config option
    // restartBrowserBetweenTests once that is not hanging.
    // See https://github.com/angular/protractor/issues/1983
    //
    // During benchmarking, we need to open a new browser
    // for every benchmark, otherwise the numbers can get skewed
    // from other benchmarks (e.g. Chrome keeps JIT caches, ...)
    if (argv['benchmark'] && !argv['dryrun']) {
      var originalBrowser = browser;
      var _tmpBrowser;
      beforeEach(function() {
        global.browser = originalBrowser.forkNewDriverInstance();
        global.element = global.browser.element;
        global.$ = global.browser.$;
        global.$$ = global.browser.$$;
      });
      afterEach(function() {
       global.browser.quit();
       global.browser = originalBrowser;
      });
    }
  },

  specs: getTestFiles(argv['benchmark'], argv['spec']),

  exclude: [
    'dist/js/cjs/**/node_modules/**',
  ],

  multiCapabilities: browsers.map(function(browserName) {
    var caps = BROWSER_CAPS[browserName];
    console.log('Testing against', browserName);
    if (!caps) {
      throw new Error('Not configured browser name: '+browserName);
    }
    return caps;
  }),

  framework: 'jasmine2',

  useAllAngular2AppRoots: true,

  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: argv['benchmark'] ? 1200000 : 60000
  },
  params: {
    benchmark: {
      scaling: [{
        userAgent: /Android/, value: 0.125
      }]
    }
  }
};

exports.createBenchpressRunner = function(options) {
  // benchpress will also load traceur runtime as our tests are written in es6
  var benchpress = require('./dist/build/benchpress_bundle');
  global.benchpress = benchpress;

  var nodeUuid = require('node-uuid');

  // TODO(tbosch): add cloud reporter again (only when !options.test)
  // var cloudReporterConfig;
  // if (process.env.CLOUD_SECRET_PATH) {
  //   console.log('using cloud reporter!');
  //   cloudReporterConfig = {
  //     auth: require(process.env.CLOUD_SECRET_PATH),
  //     projectId: 'angular-perf',
  //     datasetId: 'benchmarks',
  //     tableId: 'ng2perf'
  //   };
  // }

  var runId = nodeUuid.v1();
  if (process.env.GIT_SHA) {
    runId = process.env.GIT_SHA + ' ' + runId;
  }
  var resultsFolder = './dist/benchmark_results';
  fs.ensureDirSync(resultsFolder);
  var bindings = [
    benchpress.SeleniumWebDriverAdapter.PROTRACTOR_BINDINGS,
    benchpress.bind(benchpress.Options.FORCE_GC).toValue(argv['force-gc']),
    benchpress.bind(benchpress.Options.DEFAULT_DESCRIPTION)
        .toValue({'lang': options.lang, 'runId': runId}),
    benchpress.JsonFileReporter.PROVIDERS,
    benchpress.bind(benchpress.JsonFileReporter.PATH).toValue(resultsFolder)
  ];
  if (!argv['dryrun']) {
    bindings.push(benchpress.Validator.bindTo(benchpress.RegressionSlopeValidator));
    bindings.push(benchpress.bind(benchpress.RegressionSlopeValidator.SAMPLE_SIZE).toValue(argv['sample-size']));
    bindings.push(benchpress.MultiReporter.createBindings([
      benchpress.ConsoleReporter,
      benchpress.JsonFileReporter
    ]));
  } else {
    bindings.push(benchpress.Validator.bindTo(benchpress.SizeValidator));
    bindings.push(benchpress.bind(benchpress.SizeValidator.SAMPLE_SIZE).toValue(1));
    bindings.push(benchpress.MultiReporter.createBindings([]));
    bindings.push(benchpress.MultiMetric.createBindings([]));
  }

  global.benchpressRunner = new benchpress.Runner(bindings);
}

function mergeInto(src, target) {
  for (var prop in src) {
    target[prop] = src[prop];
  }
  return target;
 }
