/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
} from './DevToolsComponentStackFrame';

function describeFiber(
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
    Block,
    ClassComponent,
  } = workTagMap;

  const owner: null | Function = __DEV__
    ? workInProgress._debugOwner
      ? workInProgress._debugOwner.type
      : null
    : null;
  const source = __DEV__ ? workInProgress._debugSource : null;
  switch (workInProgress.tag) {
    case HostComponent:
      return describeBuiltInComponentFrame(workInProgress.type, source, owner);
    case LazyComponent:
      return describeBuiltInComponentFrame('Lazy', source, owner);
    case SuspenseComponent:
      return describeBuiltInComponentFrame('Suspense', source, owner);
    case SuspenseListComponent:
      return describeBuiltInComponentFrame('SuspenseList', source, owner);
    case FunctionComponent:
    case IndeterminateComponent:
    case SimpleMemoComponent:
      return describeFunctionComponentFrame(
        workInProgress.type,
        source,
        owner,
        currentDispatcherRef,
      );
    case ForwardRef:
      return describeFunctionComponentFrame(
        workInProgress.type.render,
        source,
        owner,
        currentDispatcherRef,
      );
    case Block:
      return describeFunctionComponentFrame(
        workInProgress.type._render,
        source,
        owner,
        currentDispatcherRef,
      );
    case ClassComponent:
      return describeClassComponentFrame(
        workInProgress.type,
        source,
        owner,
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
    let node = workInProgress;
    do {
      info += describeFiber(workTagMap, node, currentDispatcherRef);
      node = node.return;
    } while (node);
    return info;
  } catch (x) {
    return '\nError generating stack: ' + x.message + '\n' + x.stack;
  }
}
