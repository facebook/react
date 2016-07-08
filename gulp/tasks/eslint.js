/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var path = require('path');
var spawn = require('child_process').spawn;

var extension = process.platform === 'win32' ? '.cmd' : '';

module.exports = function(gulp, plugins) {
  var gutil = plugins.util;

  return function(done) {
    spawn(
      process.execPath,
      [
        path.join('node_modules', '.bin', 'eslint' + extension),
        '.',
      ],
      {
        // Allow colors to pass through
        stdio: 'inherit',
      }
    ).on('close', function(code) {
      if (code !== 0) {
        gutil.log(
          gutil.colors.red(
            'Lint failed'
          )
        );
        process.exit(code);
      }

      gutil.log(
        gutil.colors.green(
          'Lint passed'
        )
      );
      done();
    });
  };
};
