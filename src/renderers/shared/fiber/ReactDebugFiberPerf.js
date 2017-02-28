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

function getMarkName(fiber) {
  return `react:${fiber._debugID}`;
}

function shouldIgnore(fiber) {
  return typeof fiber.type === 'string';
}

let bailedFibers = new Set();

function markBeginWork(fiber) {
  if (shouldIgnore(fiber)) {
    return;
  }
  performance.mark(getMarkName(fiber));
}

function markBailWork(fiber) {
  if (shouldIgnore(fiber)) {
    return;
  }
  bailedFibers.add(fiber);
  performance.clearMarks(getMarkName(fiber));
}

function markCompleteWork(fiber) {
  if (shouldIgnore(fiber)) {
    return;
  }
  if (bailedFibers.has(fiber)) {
    bailedFibers.delete(fiber);
  } else {
    performance.measure(getLabel(fiber), getMarkName(fiber));
  }
}

exports.markBeginWork = markBeginWork;
exports.markBailWork = markBailWork;
exports.markCompleteWork = markCompleteWork;