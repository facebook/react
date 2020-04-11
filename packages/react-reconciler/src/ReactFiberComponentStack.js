/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import {
  HostComponent,
  LazyComponent,
  SuspenseComponent,
  SuspenseListComponent,
  FunctionComponent,
  IndeterminateComponent,
  ForwardRef,
  SimpleMemoComponent,
  Block,
  ClassComponent,
} from './ReactWorkTags';
import {
  describeBuiltInComponentFrame,
  describeFunctionComponentFrame,
  describeClassComponentFrame,
} from 'shared/ReactComponentStackFrame';

function describeFiber(fiber: Fiber): string {
  const owner: null | Function = __DEV__
    ? fiber._debugOwner
      ? fiber._debugOwner.type
      : null
    : null;
  const source = __DEV__ ? fiber._debugSource : null;
  switch (fiber.tag) {
    case HostComponent:
      return describeBuiltInComponentFrame(fiber.type, source, owner);
    case LazyComponent:
      return describeBuiltInComponentFrame('Lazy', source, owner);
    case SuspenseComponent:
      return describeBuiltInComponentFrame('Suspense', source, owner);
    case SuspenseListComponent:
      return describeBuiltInComponentFrame('SuspenseList', source, owner);
    case FunctionComponent:
    case IndeterminateComponent:
    case SimpleMemoComponent:
      return describeFunctionComponentFrame(fiber.type, source, owner);
    case ForwardRef:
      return describeFunctionComponentFrame(fiber.type.render, source, owner);
    case Block:
      return describeFunctionComponentFrame(fiber.type._render, source, owner);
    case ClassComponent:
      return describeClassComponentFrame(fiber.type, source, owner);
    default:
      return '';
  }
}

export function getStackByFiberInDevAndProd(workInProgress: Fiber): string {
  try {
    let info = '';
    let node = workInProgress;
    do {
      info += describeFiber(node);
      node = node.return;
    } while (node);
    return info;
  } catch (x) {
    return '\nError generating stack: ' + x.message + '\n' + x.stack;
  }
}
