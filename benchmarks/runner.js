var jsdom = require('jsdom');

jsdom.env(
  "<html><body><div id='mountNode'></div></body></html>",
  [
    '../build/react.js',
    './tests.js'
  ], function (err, window) {
    window.console.log = console.warn.bind(console);
    window.console.warn = console.warn.bind(console);
    window.TESTS.bigFlatListShouldUpdate();
    for (var i = 0; i < 100; i++) {
      window.TESTS.changeClassName();
    }
  }
);