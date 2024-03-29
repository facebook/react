/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';

import {
  HostComponent,
  HostHoistable,
  HostSingleton,
  LazyComponent,
  SuspenseComponent,
  SuspenseListComponent,
  FunctionComponent,
  IndeterminateComponent,
  ForwardRef,
  SimpleMemoComponent,
  ClassComponent,
} from './ReactWorkTags';
import {
  describeBuiltInComponentFrame,
  describeFunctionComponentFrame,
  describeClassComponentFrame,
  describeDebugInfoFrame,
} from 'shared/ReactComponentStackFrame';

function describeFiber(fiber: Fiber): string {
  const owner: null | Function = __DEV__
    ? fiber._debugOwner
      ? fiber._debugOwner.type
      : null
    : null;
  switch (fiber.tag) {
    case HostHoistable:
    case HostSingleton:
    case HostComponent:
      return describeBuiltInComponentFrame(fiber.type, owner);
    case LazyComponent:
      return describeBuiltInComponentFrame('Lazy', owner);
    case SuspenseComponent:
      return describeBuiltInComponentFrame('Suspense', owner);
    case SuspenseListComponent:
      return describeBuiltInComponentFrame('SuspenseList', owner);
    case FunctionComponent:
    case IndeterminateComponent:
    case SimpleMemoComponent:
      return describeFunctionComponentFrame(fiber.type, owner);
    case ForwardRef:
      return describeFunctionComponentFrame(fiber.type.render, owner);
    case ClassComponent:
      return describeClassComponentFrame(fiber.type, owner);
    default:
      return '';
  }
}

export function getStackByFiberInDevAndProd(workInProgress: Fiber): string {
  try {
    let info = '';
    let node: Fiber = workInProgress;
    do {
      info += describeFiber(node);
      if (__DEV__) {
        // Add any Server Component stack frames in reverse order.
        const debugInfo = node._debugInfo;
        if (debugInfo) {
          for (let i = debugInfo.length - 1; i >= 0; i--) {
            const entry = debugInfo[i];
            if (typeof entry.name === 'string') {
              info += describeDebugInfoFrame(entry.name, entry.env);
            }
          }
        }
      }
      // $FlowFixMe[incompatible-type] we bail out when we get a null
      node = node.return;
    } while (node);
    return info;
  } catch (x) {
    return '\nError generating stack: ' + x.message + '\n' + x.stack;
  }
}
