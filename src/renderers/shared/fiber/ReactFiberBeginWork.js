/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberBeginWork
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

function getElement(unitOfWork) : ReactElement {
  var element = unitOfWork.input;
  if (!element) {
    throw new Error('Should be resolved by now');
  }
  return (element : ReactElement);
}

function updateFunctionalComponent(unitOfWork) {
  var element = getElement(unitOfWork);
  var fn = element.type;
  var props = element.props;
  console.log('perform work on:', fn.name);
  var nextChildren = fn(props);

  ReactChildFiber.reconcileChildFibers(
    unitOfWork,
    nextChildren
  );
}

function updateHostComponent(unitOfWork) {
  var element = getElement(unitOfWork);
  console.log('host component', element.type);

  var nextChildren = element.props.children;
  ReactChildFiber.reconcileChildFibers(
    unitOfWork,
    nextChildren
  );
}

function mountIndeterminateComponent(unitOfWork) {
  var element = getElement(unitOfWork);
  var fn = element.type;
  var props = element.props;
  var value = fn(props);
  if (typeof value === 'object' && value && typeof value.render === 'function') {
    console.log('performed work on class:', fn.name);
    // Proceed under the assumption that this is a class instance
    unitOfWork.tag = ClassComponent;
  } else {
    console.log('performed work on fn:', fn.name);
    // Proceed under the assumption that this is a functional component
    unitOfWork.tag = FunctionalComponent;
  }
  ReactChildFiber.reconcileChildFibers(
    unitOfWork,
    value
  );
}

exports.beginWork = function(unitOfWork : Fiber) : ?Fiber {
  switch (unitOfWork.tag) {
    case IndeterminateComponent:
      mountIndeterminateComponent(unitOfWork);
      break;
    case FunctionalComponent:
      updateFunctionalComponent(unitOfWork);
      break;
    case ClassComponent:
      // $FlowFixMe
      console.log('class component', unitOfWork.input.type.name);
      break;
    case HostComponent:
      updateHostComponent(unitOfWork);
      break;
    default:
      throw new Error('Unknown unit of work tag');
  }
  return unitOfWork.child;
};
