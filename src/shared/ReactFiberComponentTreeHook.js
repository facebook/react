/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ReactFiberComponentTreeHook
 */

'use strict';

var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
} = ReactTypeOfWork;
var getComponentName = require('getComponentName');

import type { Fiber } from 'ReactFiber';
import type { Source } from 'ReactElementType';

function describeComponentFrame(name, source: Source, ownerName) {
  return '\n    in ' + (name || 'Unknown') + (
    source ?
      ' (at ' + source.fileName.replace(/^.*[\\\/]/, '') + ':' +
      source.lineNumber + ')' :
    ownerName ?
      ' (created by ' + ownerName + ')' :
      ''
  );
}

function describeFiber(fiber : Fiber) : string {
  switch (fiber.tag) {
    case IndeterminateComponent:
    case FunctionalComponent:
    case ClassComponent:
    case HostComponent:
      var owner = fiber._debugOwner;
      var source = fiber._debugSource;
      var name = getComponentName(fiber);
      var ownerName = null;
      if (owner) {
        ownerName = getComponentName(owner);
      }
      if (source) {
        return describeComponentFrame(name, source, ownerName);
      }
      return '';
    default:
      return '';
  }
}

// This function can only be called with a work-in-progress fiber and
// only during begin or complete phase. Do not call it under any other
// circumstances.
function getStackAddendumByWorkInProgressFiber(workInProgress : Fiber) : string {
  var info = '';
  var node = workInProgress;
  do {
    info += describeFiber(node);
    // Otherwise this return pointer might point to the wrong tree:
    node = node.return;
  } while (node);
  return info;
}

module.exports = {
  getStackAddendumByWorkInProgressFiber,
  describeComponentFrame,
};
