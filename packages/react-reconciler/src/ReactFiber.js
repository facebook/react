/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {ReactElement} from 'shared/ReactElementType';
import type {ReactFragment, ReactPortal} from 'shared/ReactTypes';
import type {TypeOfWork} from 'shared/ReactTypeOfWork';
import type {TypeOfInternalContext} from './ReactTypeOfInternalContext';
import type {ExpirationTime} from './ReactFiberExpirationTime';
export type {Fiber} from './ReactFiberReconcilerSharedTypes';
import invariant from 'fbjs/lib/invariant';
import {NoEffect} from 'shared/ReactTypeOfSideEffect';
import {
  IndeterminateComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CallComponent,
  ReturnComponent,
  Fragment,
} from 'shared/ReactTypeOfWork';
import getComponentName from 'shared/getComponentName';

import {NoWork} from './ReactFiberExpirationTime';
import {NoContext, AsyncUpdates} from './ReactTypeOfInternalContext';
import {
  REACT_FRAGMENT_TYPE,
  REACT_RETURN_TYPE,
  REACT_CALL_TYPE,
} from 'shared/ReactSymbols';

let hasBadMapPolyfill;

if (__DEV__) {
  hasBadMapPolyfill = false;
  try {
    const nonExtensibleObject = Object.preventExtensions({});
    const testMap = new Map([[nonExtensibleObject, null]]);
    const testSet = new Set([nonExtensibleObject]);
    // This is necessary for Rollup to not consider these unused.
    // https://github.com/rollup/rollup/issues/1771
    // TODO: we can remove these if Rollup fixes the bug.
    testMap.set(0, 0);
    testSet.add(0);
  } catch (e) {
    // TODO: Consider warning about bad polyfills
    hasBadMapPolyfill = true;
  }
}

let debugCounter;

if (__DEV__) {
  debugCounter = 1;
}

function FiberNode(
  tag: TypeOfWork,
  pendingProps: mixed,
  key: null | string,
  internalContextTag: TypeOfInternalContext,
) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;

  this.internalContextTag = internalContextTag;

  // Effects
  this.effectTag = NoEffect;
  this.nextEffect = null;

  this.firstEffect = null;
  this.lastEffect = null;

  this.expirationTime = NoWork;

  this.alternate = null;

  if (__DEV__) {
    this._debugID = debugCounter++;
    this._debugSource = null;
    this._debugOwner = null;
    this._debugIsCurrentlyTiming = false;
    if (!hasBadMapPolyfill && typeof Object.preventExtensions === 'function') {
      Object.preventExtensions(this);
    }
  }
}

// This is a constructor function, rather than a POJO constructor, still
// please ensure we do the following:
// 1) Nobody should add any instance methods on this. Instance methods can be
//    more difficult to predict when they get optimized and they are almost
//    never inlined properly in static compilers.
// 2) Nobody should rely on `instanceof Fiber` for type testing. We should
//    always know when it is a fiber.
// 3) We might want to experiment with using numeric keys since they are easier
//    to optimize in a non-JIT environment.
// 4) We can easily go from a constructor to a createFiber object literal if that
//    is faster.
// 5) It should be easy to port this to a C struct and keep a C implementation
//    compatible.
const createFiber = function(
  tag: TypeOfWork,
  pendingProps: mixed,
  key: null | string,
  internalContextTag: TypeOfInternalContext,
): Fiber {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, internalContextTag);
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

// This is used to create an alternate fiber to do work on.
export function createWorkInProgress(
  current: Fiber,
  pendingProps: any,
  expirationTime: ExpirationTime,
): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // We use a double buffering pooling technique because we know that we'll
    // only ever need at most two versions of a tree. We pool the "other" unused
    // node that we're free to reuse. This is lazily created to avoid allocating
    // extra objects for things that are never updated. It also allow us to
    // reclaim the extra memory if needed.
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.internalContextTag,
    );
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    if (__DEV__) {
      // DEV-only fields
      workInProgress._debugID = current._debugID;
      workInProgress._debugSource = current._debugSource;
      workInProgress._debugOwner = current._debugOwner;
    }

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;

    // We already have an alternate.
    // Reset the effect tag.
    workInProgress.effectTag = NoEffect;

    // The effect list is no longer valid.
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }

  workInProgress.expirationTime = expirationTime;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  return workInProgress;
}

export function createHostRootFiber(isAsync): Fiber {
  const internalContextTag = isAsync ? AsyncUpdates : NoContext;
  return createFiber(HostRoot, null, null, internalContextTag);
}

export function createFiberFromElement(
  element: ReactElement,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
): Fiber {
  let owner = null;
  if (__DEV__) {
    owner = element._owner;
  }

  let fiber;
  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  if (typeof type === 'function') {
    fiber = shouldConstruct(type)
      ? createFiber(ClassComponent, pendingProps, key, internalContextTag)
      : createFiber(
          IndeterminateComponent,
          pendingProps,
          key,
          internalContextTag,
        );
    fiber.type = type;
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent, pendingProps, key, internalContextTag);
    fiber.type = type;
  } else {
    switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(
          pendingProps.children,
          internalContextTag,
          expirationTime,
          key,
        );
      case REACT_CALL_TYPE:
        fiber = createFiber(
          CallComponent,
          pendingProps,
          key,
          internalContextTag,
        );
        fiber.type = REACT_CALL_TYPE;
        break;
      case REACT_RETURN_TYPE:
        fiber = createFiber(
          ReturnComponent,
          pendingProps,
          key,
          internalContextTag,
        );
        fiber.type = REACT_RETURN_TYPE;
        break;
      default: {
        if (
          typeof type === 'object' &&
          type !== null &&
          typeof type.tag === 'number'
        ) {
          // Currently assumed to be a continuation and therefore is a
          // fiber already.
          // TODO: The yield system is currently broken for updates in some
          // cases. The reified yield stores a fiber, but we don't know which
          // fiber that is; the current or a workInProgress? When the
          // continuation gets rendered here we don't know if we can reuse that
          // fiber or if we need to clone it. There is probably a clever way to
          // restructure this.
          fiber = ((type: any): Fiber);
          fiber.pendingProps = pendingProps;
        } else {
          let info = '';
          if (__DEV__) {
            if (
              type === undefined ||
              (typeof type === 'object' &&
                type !== null &&
                Object.keys(type).length === 0)
            ) {
              info +=
                ' You likely forgot to export your component from the file ' +
                "it's defined in, or you might have mixed up default and " +
                'named imports.';
            }
            const ownerName = owner ? getComponentName(owner) : null;
            if (ownerName) {
              info += '\n\nCheck the render method of `' + ownerName + '`.';
            }
          }
          invariant(
            false,
            'Element type is invalid: expected a string (for built-in ' +
              'components) or a class/function (for composite components) ' +
              'but got: %s.%s',
            type == null ? type : typeof type,
            info,
          );
        }
      }
    }
  }

  if (__DEV__) {
    fiber._debugSource = element._source;
    fiber._debugOwner = element._owner;
  }

  fiber.expirationTime = expirationTime;

  return fiber;
}

export function createFiberFromFragment(
  elements: ReactFragment,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
  key: null | string,
): Fiber {
  const fiber = createFiber(Fragment, elements, key, internalContextTag);
  fiber.expirationTime = expirationTime;
  return fiber;
}

export function createFiberFromText(
  content: string,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
): Fiber {
  const fiber = createFiber(HostText, content, null, internalContextTag);
  fiber.expirationTime = expirationTime;
  return fiber;
}

export function createFiberFromHostInstanceForDeletion(): Fiber {
  const fiber = createFiber(HostComponent, null, null, NoContext);
  fiber.type = 'DELETED';
  return fiber;
}

export function createFiberFromPortal(
  portal: ReactPortal,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
): Fiber {
  const pendingProps = portal.children !== null ? portal.children : [];
  const fiber = createFiber(
    HostPortal,
    pendingProps,
    portal.key,
    internalContextTag,
  );
  fiber.expirationTime = expirationTime;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null, // Used by persistent updates
    implementation: portal.implementation,
  };
  return fiber;
}
