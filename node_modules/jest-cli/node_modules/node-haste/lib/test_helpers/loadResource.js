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
 */

var MessageList = require('../MessageList');

function loadResource(loader, filePath, conf, expectation) {
  var resource;
  var error;
  var complete = false;
  runs(function() {
    loader.loadFromPath(filePath, conf, function(e, r) {
      resource = r;
      error = e;
      expect(e).toEqual(jasmine.any(MessageList));
      complete = true;
    });
  });

  waitsFor(function() {
    return complete;
  }, 500);

  runs(function() {
    expectation(error, resource);
  });
}

module.exports = loadResource;
