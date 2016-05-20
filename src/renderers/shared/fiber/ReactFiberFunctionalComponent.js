/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberFunctionalComponent
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
var createFiber = require('ReactFiber');

var ReactTypesOfWork = require('ReactTypesOfWork');
var {
  FunctionalComponent,
} = ReactTypesOfWork;

exports.performWork = function(unitOfWork : Fiber) : ?Fiber {
  var element = unitOfWork.input;
  if (!element) {
    throw new Error('Should be resolved by now');
  }
  var fn = element.type;
  var props = element.props;
  // console.log('perform work on:', fn.name);
  var nextElement = fn(props);

  if (typeof nextElement.type === 'function') {
    return exports.createFiber(nextElement);
  }
  return null;
};

exports.createFiber = function(element : ReactElement) {
  var fiber = createFiber(
    FunctionalComponent
  );
  fiber.input = element;
  return fiber;
};
