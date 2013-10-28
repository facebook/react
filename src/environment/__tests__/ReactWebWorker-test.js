/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

describe('ReactWebWorker', function() {
  ;(typeof Worker == 'undefined' ? xit : it)('can run React in a web worker', function() {
    var done = false;
    var error;

    var worker = new Worker('/worker.js');
    worker.addEventListener('message', function(e) {
      var data = JSON.parse(e.data);
      if (data.type == 'error') {
        error = data.message + "\n" + data.stack;
      } else {
        expect(data.type).toBe('done');
        done = true;
      }
    });

    waitsFor(function() {
      return done;
    });
    runs(function() {
      if (error) {
        console.log(error);
        throw new Error(error);
      }
    });
  });
});
