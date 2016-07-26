/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var grunt = require('grunt');
var rollup = require('rollup');

module.exports = function() {
  /*
    config fields:
    {
      after: Array<(code: string) => string>,
      dest: string,
      entry: string,
      format: string,
      moduleName: string,
      packageName?: string,
      plugins: Array<any>,
    }
  */

  var config = this.data;
  config.after = config.after || [];

  // This task is async...
  var done = this.async();

  var ctx = this;

  rollup.rollup({
    entry: config.entry,
    plugins: config.plugins,
  }).then(function(bundle) {
    var code = bundle.generate({
      exports: 'default',
      dest: config.dest,
      format: config.format,
      moduleName: config.moduleName,
      sourceMap: false,
      useStrict: 'true',
    }).code;

    code = config.after.reduce(function(src, postProcessor) {
      // minify and bannerify
      return postProcessor.call(ctx, src);
    }, code);

    grunt.file.write(config.dest, code);
    done();
  }).catch(function(err) {
    grunt.log.error(err);
    done();
  });
};
