/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This is a DevTools fork of ReactFiberComponentStack.
// This fork enables DevTools to use the same "native" component stack format,
// while still maintaining support for multiple renderer versions
// (which use different values for ReactTypeOfWork).

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {CurrentDispatcherRef, WorkTagMap} from './types';

import {
  describeBuiltInComponentFrame,
  describeFunctionComponentFrame,
  describeClassComponentFrame,
  describeDebugInfoFrame,
} from './DevToolsComponentStackFrame';

export function describeFiber(
  workTagMap: WorkTagMap,
  workInProgress: Fiber,
  currentDispatcherRef: CurrentDispatcherRef,
): string {
  const {
    HostComponent,
    LazyComponent,
    SuspenseComponent,
    SuspenseListComponent,
    FunctionComponent,
    IndeterminateComponent,
    SimpleMemoComponent,
    ForwardRef,
    ClassComponent,
  } = workTagMap;

  switch (workInProgress.tag) {
    case HostComponent:
      return describeBuiltInComponentFrame(workInProgress.type);
    case LazyComponent:
      return describeBuiltInComponentFrame('Lazy');
    case SuspenseComponent:
      return describeBuiltInComponentFrame('Suspense');
    case SuspenseListComponent:
      return describeBuiltInComponentFrame('SuspenseList');
    case FunctionComponent:
    case IndeterminateComponent:
    case SimpleMemoComponent:
      return describeFunctionComponentFrame(
        workInProgress.type,
        currentDispatcherRef,
      );
    case ForwardRef:
      return describeFunctionComponentFrame(
        workInProgress.type.render,
        currentDispatcherRef,
      );
    case ClassComponent:
      return describeClassComponentFrame(
        workInProgress.type,
        currentDispatcherRef,
      );
    default:
      return '';
  }
}

export function getStackByFiberInDevAndProd(
  workTagMap: WorkTagMap,
  workInProgress: Fiber,
  currentDispatcherRef: CurrentDispatcherRef,
): string {
  try {
    let info = '';
    let node: Fiber = workInProgress;
    do {
      info += describeFiber(workTagMap, node, currentDispatcherRef);
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
      // $FlowFixMe[incompatible-type] we bail out when we get a null
      node = node.return;
    } while (node);
    return info;
  } catch (x) {
    return '\nError generating stack: ' + x.message + '\n' + x.stack;
  }
}
