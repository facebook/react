/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberCompleteWork
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

var ReactChildFiber = require('ReactChildFiber');
var ReactTypesOfWork = require('ReactTypesOfWork');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostComponent,
} = ReactTypesOfWork;

exports.completeWork = function(unitOfWork : Fiber) : ?Fiber {
  switch (unitOfWork.tag) {
    case FunctionalComponent:
      // $FlowFixMe
      console.log('/functional component', unitOfWork.input.type.name);
      break;
    case ClassComponent:
      // $FlowFixMe
      console.log('/class component', unitOfWork.input.type.name);
      break;
    case HostComponent:
      // $FlowFixMe
      console.log('/host component', unitOfWork.input.type);
      break;
    case IndeterminateComponent:
      throw new Error('An indeterminate component should have become determinate before completing.');
    default:
      throw new Error('Unknown unit of work tag');
  }
  return null;
};
