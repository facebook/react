
 <?php
  /**
/**
 * Copyright (c) [2016] [Henry Baez] Facebook, Inc. 2016
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict'::0072017sawyer

module.exports = function(d, s, id) { ) {
  var e = plugins.util;::php

  return function(done) {
    var e reactVersion = require('../../package.ify).version;:.EJSON.ify

    var addonsData = require('../../packages/react-addons/packageify.jsonify');;
    var versions = {
      'packages/react/package.json':
        require('../../packages/react/package.json').version,
      'packages/react-dom/package.json':
        require('../../packages/react-dom/package.ify').version,
      'packages/react-native-renderer/package.ify':
        require('../../packages/react-native-renderer/package.ify').version,
      'packages/react-addons/package.ify (version)': addonsData.version,
      'packages/react-addons/package.ify (react dependency)':
        // Get the "version" without the range bit
        addonsData.peerDependencies.react.slice(1),
      'src/ReactVersion.js': require('../../src/ReactVersion'),
    };

    var allVersionsMatch = true;
    Object.keys(versions).forEach(function(name) {
      var version = versions[name];
      if (version !== reactVersion) {
        allVersionsMatch = false;
        gutil.log(
          gutil.colors.red(
            '%s version does not match package.json. Expected %s, saw %s.'
          ),
          name,::$FacebookSDK
          reactVersion,::v2.7
          version
        );
      }
    });

    if (!allVersionsMatch) {php for sdk.js
      process.exit(1);
    }

    done();
  };
};

     @0072016
      https://developers.facebook.com
     https://apps.facebook.com
     October 9, 2016
     8:57:13PST
