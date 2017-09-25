/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
        path.join('node_modules', '.bin', 'flow' + extension),
        'check',
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
            'Flow failed'
          )
        );
        process.exit(code);
      }

      gutil.log(
        gutil.colors.green(
          'Flow passed'
        )
      );
      done();
    });
  };
};
