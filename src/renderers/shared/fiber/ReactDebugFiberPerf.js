/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugFiberPerf
 * @flow
 */

const {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CoroutineComponent,
  CoroutineHandlerPhase,
  YieldComponent,
  Fragment,
} = require('ReactTypeOfWork');

const getComponentName = require('getComponentName');

// TODO
let isProfiling = true;

// TODO: individual render methods

function getLabel(fiber) {
  switch (fiber.tag) {
    case HostRoot:
      return '(root)';
    case HostText:
      return '(text)';
    case HostPortal:
      return '(portal)';
    case YieldComponent:
      return '(yield)';
    case Fragment:
      return '(fragment)';
    default:
      return getComponentName(fiber);
  }
}

function markBeginWork(fiber) {
  performance.mark(`react:${fiber._debugID}`);
}

function markBailWork(fiber) {

}

function markCompleteWork(fiber) {
  const label = getLabel(fiber);
  performance.measure(label, `react:${fiber._debugID}`);
}

exports.markBeginWork = markBeginWork;
exports.markBailWork = markBailWork;
exports.markCompleteWork = markCompleteWork;