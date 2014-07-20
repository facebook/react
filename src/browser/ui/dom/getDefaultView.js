/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule getDefaultView
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');

var getDefaultView = function(doc) {
  return doc.defaultView;
};

if (ExecutionEnvironment.canUseDOM) {
  // IE8 only supports the non-standard parentWindow.
  if (!('defaultView' in document)) {
    getDefaultView = function(doc) {
      return doc.parentWindow;
    };
  }
}

module.exports = getDefaultView;
