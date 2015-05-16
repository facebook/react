/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule filterDisabledEvents
 */

'use strict';

var assign = require('Object.assign');
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
  if (!props.disabled) {
    return assign({}, props);
  }

  var accepted = {};

  for (var key in props) {
    if (props.hasOwnProperty(key) && !blacklist[key]) {
      accepted[key] = props[key];
    }
  }

  return accepted;
};

module.exports = filterDisabledEvents;
