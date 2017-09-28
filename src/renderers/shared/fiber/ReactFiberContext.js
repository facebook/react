/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFiberContext
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {StackCursor} from 'ReactFiberStack';

var emptyObject = require('fbjs/lib/emptyObject');
var getComponentName = require('getComponentName');
var invariant = require('fbjs/lib/invariant');
var {isFiberMounted} = require('ReactFiberTreeReflection');
var {ClassComponent, HostRoot} = require('ReactTypeOfWork');
const {createCursor, pop, push} = require('ReactFiberStack');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var checkPropTypes = require('prop-types/checkPropTypes');
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
  var {startPhaseTimer, stopPhaseTimer} = require('ReactDebugFiberPerf');
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
    checkPropTypes(
      contextTypes,
      context,
      'context',
      name,
      ReactDebugCurrentFiber.getCurrentFiberStackAddendum,
    );
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

exports.popTopLevelContextObject = function(fiber: Fiber) {
  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
};

exports.pushTopLevelContextObject = function(
  fiber: Fiber,
  context: Object,
  didChange: boolean,
): void {
  invariant(
    contextStackCursor.cursor == null,
    'Unexpected context found on stack. ' +
      'This error is likely caused by a bug in React. Please file an issue.',
  );

  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
};

function processChildContext(fiber: Fiber, parentContext: Object): Object {
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
    ReactDebugCurrentFiber.setCurrentPhase('getChildContext');
    startPhaseTimer(fiber, 'getChildContext');
    childContext = instance.getChildContext();
    stopPhaseTimer();
    ReactDebugCurrentFiber.setCurrentPhase(null);
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
  const memoizedMergedChildContext =
    (instance && instance.__reactInternalMemoizedMergedChildContext) ||
    emptyObject;

  // Remember the parent context so we can merge with it later.
  // Inherit the parent's did-perform-work value to avoid inadvertently blocking updates.
  previousContext = contextStackCursor.current;
  push(contextStackCursor, memoizedMergedChildContext, workInProgress);
  push(
    didPerformWorkStackCursor,
    didPerformWorkStackCursor.current,
    workInProgress,
  );

  return true;
};

exports.invalidateContextProvider = function(
  workInProgress: Fiber,
  didChange: boolean,
): void {
  const instance = workInProgress.stateNode;
  invariant(
    instance,
    'Expected to have an instance by this point. ' +
      'This error is likely caused by a bug in React. Please file an issue.',
  );

  if (didChange) {
    // Merge parent and own context.
    // Skip this if we're not updating due to sCU.
    // This avoids unnecessarily recomputing memoized values.
    const mergedContext = processChildContext(workInProgress, previousContext);
    instance.__reactInternalMemoizedMergedChildContext = mergedContext;

    // Replace the old (or empty) context with the new one.
    // It is important to unwind the context in the reverse order.
    pop(didPerformWorkStackCursor, workInProgress);
    pop(contextStackCursor, workInProgress);
    // Now push the new context and mark that it has changed.
    push(contextStackCursor, mergedContext, workInProgress);
    push(didPerformWorkStackCursor, didChange, workInProgress);
  } else {
    pop(didPerformWorkStackCursor, workInProgress);
    push(didPerformWorkStackCursor, didChange, workInProgress);
  }
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
    'Expected subtree parent to be a mounted class component. ' +
      'This error is likely caused by a bug in React. Please file an issue.',
  );

  let node: Fiber = fiber;
  while (node.tag !== HostRoot) {
    if (isContextProvider(node)) {
      return node.stateNode.__reactInternalMemoizedMergedChildContext;
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
};
