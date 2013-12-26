var jsdom = require('jsdom');

jsdom.env(
  "<html><body><div id='mountNode'></div></body></html>",
  [
    '../build/react.js',
    './tests.js'
  ], function (err, window) {
    window.console.log = console.warn.bind(console);
    window.console.warn = console.warn.bind(console);

    var testName = process.argv[2];
    var iterations = parseInt(process.argv[3], 10);

    console.warn('Running %s at %s iterations', testName, iterations);

    var test = window.TESTS[testName];
    var time = process.hrtime();

    for (var i = 0; i < iterations; i++) {
      test();
    }

    var diff = process.hrtime(time);

    console.warn(
      'Execution time: %d ms',
      ((diff[0] + diff[1] / 1e9) * 1000).toFixed(1)
    );
  }
);