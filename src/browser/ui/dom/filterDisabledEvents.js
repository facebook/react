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
 * @providesModule filterDisabledEvents
*/

"use strict";

var merge = require('merge');
var keyMirror = require('keyMirror');

var blacklist = keyMirror({
  onClick: true,
  onDoubleClick: true,
  onMouseDown: true,
  onMouseMove: true,
  onMouseUp: true,
  onClickCapture: true,
  onDoubleClickCapture: true,
  onMouseDownCapture: true,
  onMouseMoveCapture: true,
  onMouseUpCapture: true
});

// Copy the props; except the mouse/touch listeners if we're disabled
var filterDisabledEvents = function(props) {
  if (!props.disabled) return merge(props);

  var accepted = {};

  for (var key in props) {
    if (props.hasOwnProperty(key) && !blacklist[key]) {
      accepted[key] = props[key];
    }
  }

  return accepted;
}

module.exports = filterDisabledEvents
