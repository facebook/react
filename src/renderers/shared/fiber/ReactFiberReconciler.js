/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberReconciler
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
var ReactFiberFunctionalComponent = require('ReactFiberFunctionalComponent');

var ReactTypesOfWork = require('ReactTypesOfWork');
var {
  FunctionalComponent,
  ClassComponent,
  HostComponent,
} = ReactTypesOfWork;

type ReactHostElement<T, P> = {
  type: T,
  props: P
};

type Deadline = {
  timeRemaining : () => number
};

var timeHeuristicForUnitOfWork = 1;

export type HostConfig<T, P, I> = {

  createHostInstance(element : ReactHostElement<T, P>) : I,
  scheduleHighPriCallback(callback : () => void) : void,
  scheduleLowPriCallback(callback : (deadline : Deadline) => void) : void

};

type OpaqueID = {};

export type Reconciler = {
  mountNewRoot(element : ReactElement) : OpaqueID;
};

module.exports = function<T, P, I>(config : HostConfig<T, P, I>) : Reconciler {

  // const scheduleHighPriCallback = config.scheduleHighPriCallback;
  const scheduleLowPriCallback = config.scheduleLowPriCallback;

  let nextUnitOfWork : ?Fiber = null;

  function performUnitOfWork(unit : Fiber) : ?Fiber {
    switch (unit.tag) {
      case FunctionalComponent:
        return ReactFiberFunctionalComponent.performWork(unit);
      case ClassComponent:
        break;
      case HostComponent:
        break;
    }
    return null;
  }

  function performLowPriWork(deadline : Deadline) {
    while (nextUnitOfWork) {
      if (deadline.timeRemaining() > timeHeuristicForUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      } else {
        scheduleLowPriCallback(performLowPriWork);
        break;
      }
    }
  }

  function ensureLowPriIsScheduled() {
    if (nextUnitOfWork) {
      return;
    }
    scheduleLowPriCallback(performLowPriWork);
  }

  /*
  function performHighPriWork() {
    // There is no such thing as high pri work yet.
  }

  function ensureHighPriIsScheduled() {
    scheduleHighPriCallback(performHighPriWork);
  }
  */

  return {

    mountNewRoot(element : ReactElement) : OpaqueID {

      ensureLowPriIsScheduled();

      nextUnitOfWork = ReactFiberFunctionalComponent.createFiber(element);

      return {};
    },

  };
};
