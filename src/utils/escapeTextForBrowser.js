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
 * @providesModule escapeTextForBrowser
 */

"use strict";

var throwIf = require('throwIf');

var ESCAPE_TYPE_ERR;

if (__DEV__) {
  ESCAPE_TYPE_ERR =
    'The React core has attempted to escape content that is of a ' +
    'mysterious type (object etc) Escaping only works on numbers and strings';
}

var ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  "\"": "&quot;",
  "'": "&#x27;",
  "/": "&#x2f;"
};

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

var escapeTextForBrowser = function (text) {
  var type = typeof text;
  var invalid = type === 'object';
  if (__DEV__) {
    throwIf(invalid, ESCAPE_TYPE_ERR);
  }
  if (text === '' || invalid) {
    return '';
  } else {
    if (type === 'string') {
      return text.replace(/[&><"'\/]/g, escaper);
    } else {
      return (''+text).replace(/[&><"'\/]/g, escaper);
    }
  }
};

module.exports = escapeTextForBrowser;
