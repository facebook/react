var jsdom = require('jsdom');

jsdom.env(
  "<html><body><div id='mountNode'></div></body></html>",
  [
    '../build/react.js',
    './tests.js'
  ], function (err, window) {
    window.TESTS.bigFlatListShouldUpdate();
  }
);