/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

describe('ReactWebWorker', function() {
  ;(typeof Worker == 'undefined' ? xit : it)('can run React in a web worker', function() {
    var done = false;
    var error;

    var worker = new Worker(window.ReactWebWorker_URL || '/src/test/worker.js?_=' + Date.now().toString(36));
    worker.addEventListener('message', function(e) {
      var data = JSON.parse(e.data);
      if (data.type == 'error') {
        error = data.message + "\n" + data.stack;
        done = true;
      } else if (data.type == 'log') {
        console.log(data.message);
      } else {
        expect(data.type).toBe('done');
        done = true;
      }
    });

    waitsFor(function() {
      return done;
    }, "the final message to arrive from the worker", 2e4);

    runs(function() {
      if (error) {
        console.error(error);
        throw new Error(error);
      }
    });
  });
});
