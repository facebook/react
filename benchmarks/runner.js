var jsdom = require('jsdom');

jsdom.env(
  "<html><body><div id='mountNode'></div></body></html>",
  [
    '../build/react.js',
    './tests.js'
  ], function (err, window) {
    window.console.log = console.warn.bind(console);
    window.console.warn = console.warn.bind(console);

    for (var testName in window.TESTS) {
      var time = process.hrtime();
      window.TESTS[testName]();
      var diff = process.hrtime(time);
      console.warn(
        '%s: %d ms',
        testName,
        ((diff[0] + diff[1] / 1e9) * 1000).toFixed(1)
      );
    }
  }
);