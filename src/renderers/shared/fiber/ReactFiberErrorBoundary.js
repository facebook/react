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
import type { FiberRoot } from 'ReactFiberRoot';

var {
  ClassComponent,
  HostContainer,
} = require('ReactTypeOfWork');

export type TrappedError = {
  boundary: Fiber | null,
  error: any,
  root: FiberRoot,
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

function findRoot(fiber : Fiber) : FiberRoot {
  while (fiber) {
    if (!fiber.return) {
      if (fiber.tag === HostContainer) {
        return ((fiber.stateNode : any) : FiberRoot);
      } else {
        throw new Error('Invalid root');
      }
    }
    fiber = fiber.return;
  }
  throw new Error('Could not find a root.');
}

function trapError(fiber : Fiber, error : any) : TrappedError {
  return {
    boundary: findClosestErrorBoundary(fiber),
    root: findRoot(fiber),
    error,
  };
}

function acknowledgeErrorInBoundary(boundary : Fiber, error : any) {
  const instance = boundary.stateNode;
  instance.unstable_handleError(error);
}

exports.trapError = trapError;
exports.acknowledgeErrorInBoundary = acknowledgeErrorInBoundary;
