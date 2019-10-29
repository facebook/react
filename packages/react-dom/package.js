'use strict';

const packageInfo = require('./package.json');

if (__EXPERIMENTAL__) {
  // Add experimental files
  packageInfo.files.push(
    'unstable-fizz.js',
    'unstable-fizz.browser.js',
    'unstable-fizz.node.js',
    'unstable-flight-server.js',
    'unstable-flight-server.browser.js',
    'unstable-flight-server.node.js',
  );

  packageInfo.browser['./unstable-fizz.js'] = './unstable-fizz.browser.js';
  packageInfo.browser['./unstable-flight-server.js'] =
    './unstable-flight-server.browser.js';
}

module.exports = packageInfo;
