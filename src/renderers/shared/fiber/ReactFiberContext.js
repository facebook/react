/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberContext
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {StackCursor} from 'ReactFiberStack';

var React = require('react');
var emptyObject = require('fbjs/lib/emptyObject');
var getComponentName = require('getComponentName');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');
var {
  isFiberMounted,
} = require('ReactFiberTreeReflection');
var {
  ClassComponent,
  HostRoot,
} = require('ReactTypeOfWork');
const {
  createCursor,
  pop,
  push,
} = require('ReactFiberStack');

if (__DEV__) {
  var ReactDebugCurrentFrame = require('react/lib/ReactDebugCurrentFrame');
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
  var {
    startPhaseTimer,
    stopPhaseTimer,
  } = require('ReactDebugFiberPerf');
  var warnedAboutMissingGetChildContext = {};
}

// A cursor to the current merged context object on the stack.
let contextStackCursor: StackCursor<Object> = createCursor(emptyObject);
// A cursor to a boolean indicating whether the context has changed.
let didPerformWorkStackCursor: StackCursor<boolean> = createCursor(false);
// Keep track of the previous context object that was on the stack.
// We use this to get access to the parent context after we have already
// pushed the next context provider, and now need to merge their contexts.
let previousContext: Object = emptyObject;

function getUnmaskedContext(workInProgress: Fiber): Object {
  const hasOwnContext = isContextProvider(workInProgress);
  if (hasOwnContext) {
    // If the fiber is a context provider itself, when we read its context
    // we have already pushed its own child context on the stack. A context
    // provider should not "see" its own child context. Therefore we read the
    // previous (parent) context instead for a context provider.
    return previousContext;
  }
  return contextStackCursor.current;
}
exports.getUnmaskedContext = getUnmaskedContext;

function cacheContext(
  workInProgress: Fiber,
  unmaskedContext: Object,
  maskedContext: Object,
) {
  const instance = workInProgress.stateNode;
  instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
  instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
}
exports.cacheContext = cacheContext;

exports.getMaskedContext = function(
  workInProgress: Fiber,
  unmaskedContext: Object,
) {
  const type = workInProgress.type;
  const contextTypes = type.contextTypes;
  if (!contextTypes) {
    return emptyObject;
  }

  // Avoid recreating masked context unless unmasked context has changed.
  // Failing to do this will result in unnecessary calls to componentWillReceiveProps.
  // This may trigger infinite loops if componentWillReceiveProps calls setState.
  const instance = workInProgress.stateNode;
  if (
    instance &&
    instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext
  ) {
    return instance.__reactInternalMemoizedMaskedChildContext;
  }

  const context = {};
  for (let key in contextTypes) {
    context[key] = unmaskedContext[key];
  }

  if (__DEV__) {
    const name = getComponentName(workInProgress) || 'Unknown';
    ReactDebugCurrentFrame.current = workInProgress;
    // $FlowFixMe - We know this export exists now, need to wait for Flow update
    React.checkPropTypes(
      contextTypes,
      context,
      'context',
      name,
      ReactDebugCurrentFrame.getStackAddendum,
    );
    ReactDebugCurrentFrame.current = null;
  }

  // Cache unmasked context so we can avoid recreating masked context unless necessary.
  // Context is created before the class component is instantiated so check for instance.
  if (instance) {
    cacheContext(workInProgress, unmaskedContext, context);
  }

  return context;
};

exports.hasContextChanged = function(): boolean {
  return didPerformWorkStackCursor.current;
};

function isContextConsumer(fiber: Fiber): boolean {
  return fiber.tag === ClassComponent && fiber.type.contextTypes != null;
}
exports.isContextConsumer = isContextConsumer;

function isContextProvider(fiber: Fiber): boolean {
  return fiber.tag === ClassComponent && fiber.type.childContextTypes != null;
}
exports.isContextProvider = isContextProvider;

function popContextProvider(fiber: Fiber): void {
  if (!isContextProvider(fiber)) {
    return;
  }

  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
}
exports.popContextProvider = popContextProvider;

exports.pushTopLevelContextObject = function(
  fiber: Fiber,
  context: Object,
  didChange: boolean,
): void {
  invariant(
    contextStackCursor.cursor == null,
    'Unexpected context found on stack',
  );

  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
};

function processChildContext(
  fiber: Fiber,
  parentContext: Object,
  isReconciling: boolean,
): Object {
  const instance = fiber.stateNode;
  const childContextTypes = fiber.type.childContextTypes;

  // TODO (bvaughn) Replace this behavior with an invariant() in the future.
  // It has only been added in Fiber to match the (unintentional) behavior in Stack.
  if (typeof instance.getChildContext !== 'function') {
    if (__DEV__) {
      const componentName = getComponentName(fiber) || 'Unknown';

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
    return parentContext;
  }

  let childContext;
  if (__DEV__) {
    ReactDebugCurrentFiber.phase = 'getChildContext';
    startPhaseTimer(fiber, 'getChildContext');
    childContext = instance.getChildContext();
    stopPhaseTimer();
    ReactDebugCurrentFiber.phase = null;
  } else {
    childContext = instance.getChildContext();
  }
  for (let contextKey in childContext) {
    invariant(
      contextKey in childContextTypes,
      '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
      getComponentName(fiber) || 'Unknown',
      contextKey,
    );
  }
  if (__DEV__) {
    const name = getComponentName(fiber) || 'Unknown';
    // We can only provide accurate element stacks if we pass work-in-progress tree
    // during the begin or complete phase. However currently this function is also
    // called from unstable_renderSubtree legacy implementation. In this case it unsafe to
    // assume anything about the given fiber. We won't pass it down if we aren't sure.
    // TODO: remove this hack when we delete unstable_renderSubtree in Fiber.
    const workInProgress = isReconciling ? fiber : null;
    ReactDebugCurrentFrame.current = workInProgress;
    // $FlowFixMe - We know this export exists now, need to wait for Flow update
    React.checkPropTypes(
      childContextTypes,
      childContext,
      'child context',
      name,
      ReactDebugCurrentFrame.getStackAddendum,
    );
    ReactDebugCurrentFrame.current = null;
  }

  return {...parentContext, ...childContext};
}
exports.processChildContext = processChildContext;

exports.pushContextProvider = function(workInProgress: Fiber): boolean {
  if (!isContextProvider(workInProgress)) {
    return false;
  }

  const instance = workInProgress.stateNode;
  // We push the context as early as possible to ensure stack integrity.
  // If the instance does not exist yet, we will push null at first,
  // and replace it on the stack later when invalidating the context.
  const memoizedMergedChildContext = (instance &&
    instance.__reactInternalMemoizedMergedChildContext) ||
    emptyObject;

  // Remember the parent context so we can merge with it later.
  previousContext = contextStackCursor.current;
  push(contextStackCursor, memoizedMergedChildContext, workInProgress);
  push(didPerformWorkStackCursor, false, workInProgress);

  return true;
};

exports.invalidateContextProvider = function(workInProgress: Fiber): void {
  const instance = workInProgress.stateNode;
  invariant(instance, 'Expected to have an instance by this point.');

  // Merge parent and own context.
  const mergedContext = processChildContext(
    workInProgress,
    previousContext,
    true,
  );
  instance.__reactInternalMemoizedMergedChildContext = mergedContext;

  // Replace the old (or empty) context with the new one.
  // It is important to unwind the context in the reverse order.
  pop(didPerformWorkStackCursor, workInProgress);
  pop(contextStackCursor, workInProgress);
  // Now push the new context and mark that it has changed.
  push(contextStackCursor, mergedContext, workInProgress);
  push(didPerformWorkStackCursor, true, workInProgress);
};

exports.resetContext = function(): void {
  previousContext = emptyObject;
  contextStackCursor.current = emptyObject;
  didPerformWorkStackCursor.current = false;
};

exports.findCurrentUnmaskedContext = function(fiber: Fiber): Object {
  // Currently this is only used with renderSubtreeIntoContainer; not sure if it
  // makes sense elsewhere
  invariant(
    isFiberMounted(fiber) && fiber.tag === ClassComponent,
    'Expected subtree parent to be a mounted class component',
  );

  let node: Fiber = fiber;
  while (node.tag !== HostRoot) {
    if (isContextProvider(node)) {
      return node.stateNode.__reactInternalMemoizedMergedChildContext;
    }
    const parent = node.return;
    invariant(parent, 'Found unexpected detached subtree parent');
    node = parent;
  }
  return node.stateNode.context;
};
