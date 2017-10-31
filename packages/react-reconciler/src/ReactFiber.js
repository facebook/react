/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import type {ReactElement, Source} from 'shared/ReactElementType';
import type {
  ReactCall,
  ReactFragment,
  ReactPortal,
  ReactReturn,
} from 'shared/ReactTypes';
import type {TypeOfWork} from 'shared/ReactTypeOfWork';
import type {TypeOfInternalContext} from './ReactTypeOfInternalContext';
import type {TypeOfSideEffect} from 'shared/ReactTypeOfSideEffect';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {UpdateQueue} from './ReactFiberUpdateQueue';

var invariant = require('fbjs/lib/invariant');
var {NoEffect} = require('shared/ReactTypeOfSideEffect');
var {
  IndeterminateComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CallComponent,
  ReturnComponent,
  Fragment,
} = require('shared/ReactTypeOfWork');

var {NoWork} = require('./ReactFiberExpirationTime');
var {NoContext} = require('./ReactTypeOfInternalContext');

if (__DEV__) {
  var getComponentName = require('shared/getComponentName');

  var hasBadMapPolyfill = false;
  try {
    const nonExtensibleObject = Object.preventExtensions({});
    /* eslint-disable no-new */
    new Map([[nonExtensibleObject, null]]);
    new Set([nonExtensibleObject]);
    /* eslint-enable no-new */
  } catch (e) {
    // TODO: Consider warning about bad polyfills
    hasBadMapPolyfill = true;
  }
}

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
export type Fiber = {|
  // These first fields are conceptually members of an Instance. This used to
  // be split into a separate type and intersected with the other Fiber fields,
  // but until Flow fixes its intersection bugs, we've merged them into a
  // single type.

  // An Instance is shared between all versions of a component. We can easily
  // break this out into a separate object to avoid copying so much to the
  // alternate versions of the tree. We put this on a single object for now to
  // minimize the number of objects created during the initial render.

  // Tag identifying the type of fiber.
  tag: TypeOfWork,

  // Unique identifier of this child.
  key: null | string,

  // The function/class/module associated with this fiber.
  type: any,

  // The local state associated with this fiber.
  stateNode: any,

  // Conceptual aliases
  // parent : Instance -> return The parent happens to be the same as the
  // return fiber since we've merged the fiber and instance.

  // Remaining fields belong to Fiber

  // The Fiber to return to after finishing processing this one.
  // This is effectively the parent, but there can be multiple parents (two)
  // so this is only the parent of the thing we're currently processing.
  // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null,

  // Singly Linked List Tree Structure.
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  // The ref last used to attach this node.
  // I'll avoid adding an owner field for prod and model that as functions.
  ref: null | (((handle: mixed) => void) & {_stringRef: ?string}),

  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any, // This type will be more specific once we overload the tag.
  memoizedProps: any, // The props used to create the output.

  // A queue of state updates and callbacks.
  updateQueue: UpdateQueue<any> | null,

  // The state used to create the output
  memoizedState: any,

  // Bitfield that describes properties about the fiber and its subtree. E.g.
  // the AsyncUpdates flag indicates whether the subtree should be async-by-
  // default. When a fiber is created, it inherits the internalContextTag of its
  // parent. Additional flags can be set at creation time, but after than the
  // value should remain unchanged throughout the fiber's lifetime, particularly
  // before its child fibers are created.
  internalContextTag: TypeOfInternalContext,

  // Effect
  effectTag: TypeOfSideEffect,

  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null,

  // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  firstEffect: Fiber | null,
  lastEffect: Fiber | null,

  // Represents a time in the future by which this work should be completed.
  // This is also used to quickly determine if a subtree has no pending changes.
  expirationTime: ExpirationTime,

  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null,

  // Conceptual aliases
  // workInProgress : Fiber ->  alternate The alternate used for reuse happens
  // to be the same as work in progress.
  // __DEV__ only
  _debugID?: number,
  _debugSource?: Source | null,
  _debugOwner?: Fiber | null,
  _debugIsCurrentlyTiming?: boolean,
|};

if (__DEV__) {
  var debugCounter = 1;
}

function FiberNode(
  tag: TypeOfWork,
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

  this.pendingProps = null;
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
var createFiber = function(
  tag: TypeOfWork,
  key: null | string,
  internalContextTag: TypeOfInternalContext,
): Fiber {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, key, internalContextTag);
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

// This is used to create an alternate fiber to do work on.
exports.createWorkInProgress = function(
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
    // We already have an alternate.
    // Reset the effect tag.
    workInProgress.effectTag = NoEffect;

    // The effect list is no longer valid.
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }

  workInProgress.expirationTime = expirationTime;
  workInProgress.pendingProps = pendingProps;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  return workInProgress;
};

exports.createHostRootFiber = function(): Fiber {
  const fiber = createFiber(HostRoot, null, NoContext);
  return fiber;
};

exports.createFiberFromElement = function(
  element: ReactElement,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
): Fiber {
  let owner = null;
  if (__DEV__) {
    owner = element._owner;
  }

  let fiber;
  const {type, key} = element;
  if (typeof type === 'function') {
    fiber = shouldConstruct(type)
      ? createFiber(ClassComponent, key, internalContextTag)
      : createFiber(IndeterminateComponent, key, internalContextTag);
    fiber.type = type;
    fiber.pendingProps = element.props;
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent, key, internalContextTag);
    fiber.type = type;
    fiber.pendingProps = element.props;
  } else if (
    typeof type === 'object' &&
    type !== null &&
    typeof type.tag === 'number'
  ) {
    // Currently assumed to be a continuation and therefore is a fiber already.
    // TODO: The yield system is currently broken for updates in some cases.
    // The reified yield stores a fiber, but we don't know which fiber that is;
    // the current or a workInProgress? When the continuation gets rendered here
    // we don't know if we can reuse that fiber or if we need to clone it.
    // There is probably a clever way to restructure this.
    fiber = ((type: any): Fiber);
    fiber.pendingProps = element.props;
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
          "it's defined in.";
      }
      const ownerName = owner ? getComponentName(owner) : null;
      if (ownerName) {
        info += '\n\nCheck the render method of `' + ownerName + '`.';
      }
    }
    invariant(
      false,
      'Element type is invalid: expected a string (for built-in components) ' +
        'or a class/function (for composite components) but got: %s.%s',
      type == null ? type : typeof type,
      info,
    );
  }

  if (__DEV__) {
    fiber._debugSource = element._source;
    fiber._debugOwner = element._owner;
  }

  fiber.expirationTime = expirationTime;

  return fiber;
};

function createFiberFromFragment(
  elements: ReactFragment,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
  key: null | string,
): Fiber {
  const fiber = createFiber(Fragment, key, internalContextTag);
  fiber.pendingProps = elements;
  fiber.expirationTime = expirationTime;
  return fiber;
}

exports.createFiberFromFragment = createFiberFromFragment;

exports.createFiberFromText = function(
  content: string,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
): Fiber {
  const fiber = createFiber(HostText, null, internalContextTag);
  fiber.pendingProps = content;
  fiber.expirationTime = expirationTime;
  return fiber;
};

exports.createFiberFromHostInstanceForDeletion = function(): Fiber {
  const fiber = createFiber(HostComponent, null, NoContext);
  fiber.type = 'DELETED';
  return fiber;
};

exports.createFiberFromCall = function(
  call: ReactCall,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
): Fiber {
  const fiber = createFiber(CallComponent, call.key, internalContextTag);
  fiber.type = call.handler;
  fiber.pendingProps = call;
  fiber.expirationTime = expirationTime;
  return fiber;
};

exports.createFiberFromReturn = function(
  returnNode: ReactReturn,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
): Fiber {
  const fiber = createFiber(ReturnComponent, null, internalContextTag);
  fiber.expirationTime = expirationTime;
  return fiber;
};

exports.createFiberFromPortal = function(
  portal: ReactPortal,
  internalContextTag: TypeOfInternalContext,
  expirationTime: ExpirationTime,
): Fiber {
  const fiber = createFiber(HostPortal, portal.key, internalContextTag);
  fiber.pendingProps = portal.children || [];
  fiber.expirationTime = expirationTime;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null, // Used by persistent updates
    implementation: portal.implementation,
  };
  return fiber;
};
