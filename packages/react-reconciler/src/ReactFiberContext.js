/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ReactContext} from 'shared/ReactTypes';
import {isFiberMounted} from 'react-reconciler/reflection';
import {ClassComponent, HostRoot} from 'shared/ReactTypeOfWork';
import getComponentName from 'shared/getComponentName';
import invariant from 'shared/invariant';
import warning from 'shared/warning';
import checkPropTypes from 'prop-types/checkPropTypes';

import ReactDebugCurrentFiber from './ReactDebugCurrentFiber';
import {startPhaseTimer, stopPhaseTimer} from './ReactDebugFiberPerf';
import {REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE} from 'shared/ReactSymbols';
import {readContext, pushContext, popContext} from './ReactFiberNewContext';
import maxSigned31BitInt from './maxSigned31BitInt';
import {DidThrow, NoEffect} from 'shared/ReactTypeOfSideEffect';

let warnedAboutMissingGetChildContext;

if (__DEV__) {
  warnedAboutMissingGetChildContext = {};
}
export const emptyContextObject = {};
if (__DEV__) {
  Object.freeze(emptyContextObject);
}

export const LegacyContext: ReactContext<any> = {
  $$typeof: REACT_CONTEXT_TYPE,
  _calculateChangedBits: null,
  _defaultValue: emptyContextObject,
  _currentValue: emptyContextObject,
  _currentValue2: emptyContextObject,
  _changedBits: 0,
  _changedBits2: 0,
  // These are circular
  Provider: (null: any),
  Consumer: (null: any),
  unstable_read: (null: any),
};

LegacyContext.Provider = {
  $$typeof: REACT_PROVIDER_TYPE,
  _context: LegacyContext,
};
LegacyContext.Consumer = LegacyContext;
LegacyContext.unstable_read = readContext.bind(null, LegacyContext);

if (__DEV__) {
  LegacyContext._currentRenderer = null;
  LegacyContext._currentRenderer2 = null;
}

export function calculateLegacyChildContext(
  workInProgress: Fiber,
  childContextTypes: Object,
  unmaskedParentContext: Object,
): Object {
  const instance = workInProgress.stateNode;

  let childContext;
  // TODO (bvaughn) Replace this behavior with an invariant() in the future.
  // It has only been added in Fiber to match the (unintentional) behavior in Stack.
  if (typeof instance.getChildContext !== 'function') {
    if (__DEV__) {
      const componentName = getComponentName(workInProgress) || 'Unknown';

      if (!warnedAboutMissingGetChildContext[componentName]) {
        warnedAboutMissingGetChildContext[componentName] = true;
        warning(
          false,
          '%s.childContextTypes is specified but there is no getChildContext() method ' +
            'on the instance. You can either define getChildContext() on %s or remove ' +
            'childContextTypes from it.',
          componentName,
          componentName,
        );
      }
    }
    childContext = unmaskedParentContext;
  } else {
    if (__DEV__) {
      ReactDebugCurrentFiber.setCurrentPhase('getChildContext');
    }
    startPhaseTimer(workInProgress, 'getChildContext');
    childContext = instance.getChildContext();
    stopPhaseTimer();
    if (__DEV__) {
      ReactDebugCurrentFiber.setCurrentPhase(null);
    }
    for (let contextKey in childContext) {
      invariant(
        contextKey in childContextTypes,
        '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
        getComponentName(workInProgress) || 'Unknown',
        contextKey,
      );
    }
    if (__DEV__) {
      const name = getComponentName(workInProgress) || 'Unknown';
      checkPropTypes(
        childContextTypes,
        childContext,
        'child context',
        name,
        // In practice, there is one case in which we won't get a stack. It's when
        // somebody calls unstable_renderSubtreeIntoContainer() and we process
        // context from the parent component instance. The stack will be missing
        // because it's outside of the reconciliation, and so the pointer has not
        // been set. This is rare and doesn't matter. We'll also remove that API.
        ReactDebugCurrentFiber.getCurrentFiberStackAddendum,
      );
    }
    childContext = Object.assign({}, unmaskedParentContext, childContext);
  }

  return childContext;
}

export function pushLegacyContext(
  workInProgress: Fiber,
  childContextTypes: Object,
  childContext: Object,
  didChange: boolean,
): void {
  const changedBits = didChange ? maxSigned31BitInt : 0;
  pushContext(workInProgress, LegacyContext, childContext, changedBits);
}

export function popLegacyContext(workInProgress: Fiber): void {
  // Legacy context providers do not push their child context until the end of
  // the render phase. If the render phase did not complete, the child context
  // was never pushed.
  if ((workInProgress.effectTag & DidThrow) === NoEffect) {
    const childContextTypes = workInProgress.type.childContextTypes;
    if (typeof childContextTypes === 'object' && childContextTypes != null) {
      popContext(workInProgress, LegacyContext);
    }
  }
}

export function pushRootLegacyContext(
  workInProgress: Fiber,
  rootContext: Object,
  didChange: boolean,
): void {
  const changedBits = didChange ? maxSigned31BitInt : 0;
  pushContext(workInProgress, LegacyContext, rootContext, changedBits);
}

export function popRootLegacyContext(workInProgress: Fiber): void {
  popContext(workInProgress, LegacyContext);
}

export function readUnmaskedLegacyContext(): Object {
  return readContext(LegacyContext);
}

export function maskLegacyContext(
  workInProgress: Fiber,
  unmaskedContext: Object,
  contextTypes: Object,
): Object {
  const maskedContext = {};
  for (let key in contextTypes) {
    maskedContext[key] = unmaskedContext[key];
  }

  if (__DEV__) {
    const name = getComponentName(workInProgress) || 'Unknown';
    checkPropTypes(
      contextTypes,
      maskedContext,
      'context',
      name,
      ReactDebugCurrentFiber.getCurrentFiberStackAddendum,
    );
  }
  return maskedContext;
}

export function findCurrentUnmaskedContext(fiber: Fiber): Object {
  // Currently this is only used with renderSubtreeIntoContainer; not sure if it
  // makes sense elsewhere
  invariant(
    isFiberMounted(fiber) && fiber.tag === ClassComponent,
    'Expected subtree parent to be a mounted class component. ' +
      'This error is likely caused by a bug in React. Please file an issue.',
  );

  let node: Fiber = fiber;
  while (node.tag !== HostRoot) {
    if (node.tag === ClassComponent && node.type.childContextTypes != null) {
      return node.stateNode.__reactInternalUnmaskedLegacyChildContext;
    }
    const parent = node.return;
    invariant(
      parent,
      'Found unexpected detached subtree parent. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
    node = parent;
  }
  return node.stateNode.context;
}
