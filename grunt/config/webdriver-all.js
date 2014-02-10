'use strict';

var grunt = require('grunt');

module.exports = function(props){
  if (typeof props.url != 'string') {
    throw TypeError('expected url string');
  }
  if ('isDoneTimeout' in props && typeof props.isDoneTimeout != 'number') {
    throw TypeError('expected isDoneTimeout to be a number');
  }
  if ('onStart' in props && typeof props.onStart != 'function') {
    throw TypeError('expected onStart to be a function');
  }
  if ('onComplete' in props && typeof props.onComplete != 'function') {
    throw TypeError('expected onComplete to be a function');
  }
  if ('onError' in props && typeof props.onError != 'function') {
    throw TypeError('expected onError to be a function');
  }

  var exports = {};

  exports.local = {
    webdriver: {
      remote: { protocol: 'http:', hostname: '127.0.0.1', port: 9515, path: '/' }
    },
    url: props.url,
    onStart: props.onStart,
    onComplete: props.onComplete,
    onError: props.onError,
    isDoneTimeout: props.isDoneTimeout
  };

  if (grunt.option('debug')) {
    exports.local.url += (exports.local.url.indexOf('?') == -1 ? '?' : '&') + 'debug=' + grunt.option('debug');
  }

  exports.saucelabs = {
    webdriver: {
      remote: {
        /* https://github.com/admc/wd/blob/master/README.md#named-parameters */
        user: process.env.SAUCE_USERNAME || 'React',
        pwd: process.env.SAUCE_ACCESS_KEY || '339d32ca-d594-4570-a3c2-94c50a91919b',
        protocol: 'http:',
        hostname: 'ondemand.saucelabs.com',
        port: '80',
        path: '/wd/hub'
      }
    },
    desiredCapabilities: {
      "build": process.env.TRAVIS_BUILD_NUMBER || 'dev' + Date.now(),
      "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER || 'my awesome tunnel',
      "browserName": "chrome"
    },
    url: exports.local.url,
    onStart: function(browser){
      grunt.log.writeln("Starting WebDriver Test. Watch results here: http://saucelabs.com/tests/" + browser.sessionID);
      if (props.onStart) {
        return props.onStart(browser);
      }
    },
    onComplete: exports.local.onComplete,
    onError: exports.local.onError,
    isDoneTimeout: exports.local.isDoneTimeout
  };

  /* https://saucelabs.com/platforms */
  exports.saucelabs_ios =
  exports.saucelabs_ios7 = sauceItUp({ browserName: 'iphone', version: '7', platform:'OS X 10.9' });
  exports.saucelabs_ios6_1 = sauceItUp({ browserName: 'iphone', version: '6.1', platform:'OS X 10.8' });
  exports.saucelabs_ios6 = sauceItUp({ browserName: 'iphone', version: '6', platform:'OS X 10.8' });
  exports.saucelabs_ios5_1 = sauceItUp({ browserName: 'iphone', version: '5.1', platform:'OS X 10.8' });
  exports.saucelabs_ios5 = sauceItUp({ browserName: 'iphone', version: '5', platform:'OS X 10.6' });
  exports.saucelabs_ios4 = sauceItUp({ browserName: 'iphone', version: '4', platform:'OS X 10.6' });

  exports.saucelabs_ipad =
  exports.saucelabs_ipad7 = sauceItUp({ browserName: 'ipad', version: '7', platform:'OS X 10.9' });
  exports.saucelabs_ipad6_1 = sauceItUp({ browserName: 'ipad', version: '6.1', platform:'OS X 10.8' });
  exports.saucelabs_ipad6 = sauceItUp({ browserName: 'ipad', version: '6', platform:'OS X 10.8' });
  exports.saucelabs_ipad5_1 = sauceItUp({ browserName: 'ipad', version: '5.1', platform:'OS X 10.8' });
  exports.saucelabs_ipad5 = sauceItUp({ browserName: 'ipad', version: '5', platform:'OS X 10.6' });
  exports.saucelabs_ipad4 = sauceItUp({ browserName: 'ipad', version: '4', platform:'OS X 10.6' });

  exports.saucelabs_android = sauceItUp({ browserName: 'android', version: '4.0', platform:'Linux' });
  exports.saucelabs_android_tablet = sauceItUp({ browserName: 'android', version: '4.0', platform:'Linux', 'device-type':'tablet' });

  exports.saucelabs_safari = sauceItUp({ browserName: 'safari' });
  exports.saucelabs_chrome = sauceItUp({ browserName: 'chrome' });
  exports.saucelabs_firefox = sauceItUp({ browserName: 'firefox' });

  exports.saucelabs_ie =
  exports.saucelabs_ie8 = sauceItUp({ browserName: 'internet explorer', version: 8 });
  exports.saucelabs_ie9 = sauceItUp({ browserName: 'internet explorer', version: 9 });
  exports.saucelabs_ie10 = sauceItUp({ browserName: 'internet explorer', version: 10 });
  exports.saucelabs_ie11 = sauceItUp({ browserName: 'internet explorer', version: 11, platform:'Windows 8.1' });

  function sauceItUp(desiredCapabilities) {
    desiredCapabilities["build"] = exports.saucelabs.desiredCapabilities["build"];
    desiredCapabilities["tunnel-identifier"] = exports.saucelabs.desiredCapabilities["tunnel-identifier"];
    return {
      webdriver: exports.saucelabs.webdriver,
      url: exports.saucelabs.url,
      onStart: exports.saucelabs.onStart,
      onComplete: exports.saucelabs.onComplete,
      onError: exports.saucelabs.onError,
      isDoneTimeout: exports.saucelabs.isDoneTimeout,
      desiredCapabilities: desiredCapabilities,
    };
  }

  return exports;
};
