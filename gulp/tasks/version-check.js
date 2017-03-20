/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

module.exports = function(gulp, plugins) {
  var gutil = plugins.util;

  return function(done) {
    var reactVersion = require('../../package.json').version;

    var versions = {
      'packages/react/package.json':
        require('../../packages/react/package.json').version,
      'packages/react-dom/package.json':
        require('../../packages/react-dom/package.json').version,
      'packages/react-native-renderer/package.json':
        require('../../packages/react-native-renderer/package.json').version,
      'packages/react-test-renderer/package.json':
        require('../../packages/react-test-renderer/package.json').version,
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
          name,
          reactVersion,
          version
        );
      }
    });

    if (!allVersionsMatch) {
      process.exit(1);
    }

    done();
  };
};
