/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberErrorBoundary
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

var {
  ClassComponent,
} = require('ReactTypeOfWork');

export type TrappedError = {
  boundary: Fiber | null,
  error: any,
};

function findClosestErrorBoundary(fiber : Fiber): Fiber | null {
  let maybeErrorBoundary = fiber.return;
  while (maybeErrorBoundary) {
    if (maybeErrorBoundary.tag === ClassComponent) {
      const instance = maybeErrorBoundary.stateNode;
      if (typeof instance.unstable_handleError === 'function') {
        return maybeErrorBoundary;
      }
    }
    maybeErrorBoundary = maybeErrorBoundary.return;
  }
  return null;
}

function trapError(fiber : Fiber, error : any) : TrappedError {
  return {
    boundary: findClosestErrorBoundary(fiber),
    error,
  };
}

function acknowledgeErrorInBoundary(boundary : Fiber, error : any) {
  const instance = boundary.stateNode;
  instance.unstable_handleError(error);
}

exports.trapError = trapError;
exports.acknowledgeErrorInBoundary = acknowledgeErrorInBoundary;
