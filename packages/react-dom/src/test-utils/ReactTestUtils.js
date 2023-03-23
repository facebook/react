/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {findCurrentFiberUsingSlowPath} from 'react-reconciler/src/ReactFiberTreeReflection';
import {get as getInstance} from 'shared/ReactInstanceMap';
import {
  ClassComponent,
  FunctionComponent,
  HostComponent,
  HostHoistable,
  HostSingleton,
  HostText,
} from 'react-reconciler/src/ReactWorkTags';
import {SyntheticEvent} from 'react-dom-bindings/src/events/SyntheticEvent';
import {ELEMENT_NODE} from 'react-dom-bindings/src/client/HTMLNodeType';
import {
  rethrowCaughtError,
  invokeGuardedCallbackAndCatchFirstError,
} from 'shared/ReactErrorUtils';
import {enableFloat, enableHostSingletons} from 'shared/ReactFeatureFlags';
import assign from 'shared/assign';
import isArray from 'shared/isArray';

// Keep in sync with ReactDOM.js:
const SecretInternals =
  ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
const EventInternals = SecretInternals.Events;
const getInstanceFromNode = EventInternals[0];
const getNodeFromInstance = EventInternals[1];
const getFiberCurrentPropsFromNode = EventInternals[2];
const enqueueStateRestore = EventInternals[3];
const restoreStateIfNeeded = EventInternals[4];

const act = React.unstable_act;

function Event(suffix) {}

let hasWarnedAboutDeprecatedMockComponent = false;

/**
 * @class ReactTestUtils
 */

function findAllInRenderedFiberTreeInternal(fiber, test) {
  if (!fiber) {
    return [];
  }
  const currentParent = findCurrentFiberUsingSlowPath(fiber);
  if (!currentParent) {
    return [];
  }
  let node = currentParent;
  const ret = [];
  while (true) {
    if (
      node.tag === HostComponent ||
      node.tag === HostText ||
      node.tag === ClassComponent ||
      node.tag === FunctionComponent ||
      (enableFloat ? node.tag === HostHoistable : false) ||
      (enableHostSingletons ? node.tag === HostSingleton : false)
    ) {
      const publicInst = node.stateNode;
      if (test(publicInst)) {
        ret.push(publicInst);
      }
    }
    if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === currentParent) {
      return ret;
    }
    while (!node.sibling) {
      if (!node.return || node.return === currentParent) {
        return ret;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function validateClassInstance(inst, methodName) {
  if (!inst) {
    // This is probably too relaxed but it's existing behavior.
    return;
  }
  if (getInstance(inst)) {
    // This is a public instance indeed.
    return;
  }
  let received;
  const stringified = String(inst);
  if (isArray(inst)) {
    received = 'an array';
  } else if (inst && inst.nodeType === ELEMENT_NODE && inst.tagName) {
    received = 'a DOM node';
  } else if (stringified === '[object Object]') {
    received = 'object with keys {' + Object.keys(inst).join(', ') + '}';
  } else {
    received = stringified;
  }

  throw new Error(
    `${methodName}(...): the first argument must be a React class instance. ` +
      `Instead received: ${received}.`,
  );
}

/**
 * Utilities for making it easy to test React components.
 *
 * See https://reactjs.org/docs/test-utils.html
 *
 * Todo: Support the entire DOM.scry query syntax. For now, these simple
 * utilities will suffice for testing purposes.
 * @lends ReactTestUtils
 */
function renderIntoDocument(element) {
  const div = document.createElement('div');
  // None of our tests actually require attaching the container to the
  // DOM, and doing so creates a mess that we rely on test isolation to
  // clean up, so we're going to stop honoring the name of this method
  // (and probably rename it eventually) if no problems arise.
  // document.documentElement.appendChild(div);
  return ReactDOM.render(element, div);
}

function isElement(element) {
  return React.isValidElement(element);
}

function isElementOfType(inst, convenienceConstructor) {
  return React.isValidElement(inst) && inst.type === convenienceConstructor;
}

function isDOMComponent(inst) {
  return !!(inst && inst.nodeType === ELEMENT_NODE && inst.tagName);
}

function isDOMComponentElement(inst) {
  return !!(inst && React.isValidElement(inst) && !!inst.tagName);
}

function isCompositeComponent(inst) {
  if (isDOMComponent(inst)) {
    // Accessing inst.setState warns; just return false as that'll be what
    // this returns when we have DOM nodes as refs directly
    return false;
  }
  return (
    inst != null &&
    typeof inst.render === 'function' &&
    typeof inst.setState === 'function'
  );
}

function isCompositeComponentWithType(inst, type) {
  if (!isCompositeComponent(inst)) {
    return false;
  }
  const internalInstance = getInstance(inst);
  const constructor = internalInstance.type;
  return constructor === type;
}

function findAllInRenderedTree(inst, test) {
  validateClassInstance(inst, 'findAllInRenderedTree');
  if (!inst) {
    return [];
  }
  const internalInstance = getInstance(inst);
  return findAllInRenderedFiberTreeInternal(internalInstance, test);
}

/**
 * Finds all instances of components in the rendered tree that are DOM
 * components with the class name matching `className`.
 * @return {array} an array of all the matches.
 */
function scryRenderedDOMComponentsWithClass(root, classNames) {
  validateClassInstance(root, 'scryRenderedDOMComponentsWithClass');
  return findAllInRenderedTree(root, function (inst) {
    if (isDOMComponent(inst)) {
      let className = inst.className;
      if (typeof className !== 'string') {
        // SVG, probably.
        className = inst.getAttribute('class') || '';
      }
      const classList = className.split(/\s+/);

      if (!isArray(classNames)) {
        if (classNames === undefined) {
          throw new Error(
            'TestUtils.scryRenderedDOMComponentsWithClass expects a ' +
              'className as a second argument.',
          );
        }

        classNames = classNames.split(/\s+/);
      }
      return classNames.every(function (name) {
        return classList.indexOf(name) !== -1;
      });
    }
    return false;
  });
}

/**
 * Like scryRenderedDOMComponentsWithClass but expects there to be one result,
 * and returns that one result, or throws exception if there is any other
 * number of matches besides one.
 * @return {!ReactDOMComponent} The one match.
 */
function findRenderedDOMComponentWithClass(root, className) {
  validateClassInstance(root, 'findRenderedDOMComponentWithClass');
  const all = scryRenderedDOMComponentsWithClass(root, className);
  if (all.length !== 1) {
    throw new Error(
      'Did not find exactly one match (found: ' +
        all.length +
        ') ' +
        'for class:' +
        className,
    );
  }
  return all[0];
}

/**
 * Finds all instances of components in the rendered tree that are DOM
 * components with the tag name matching `tagName`.
 * @return {array} an array of all the matches.
 */
function scryRenderedDOMComponentsWithTag(root, tagName) {
  validateClassInstance(root, 'scryRenderedDOMComponentsWithTag');
  return findAllInRenderedTree(root, function (inst) {
    return (
      isDOMComponent(inst) &&
      inst.tagName.toUpperCase() === tagName.toUpperCase()
    );
  });
}

/**
 * Like scryRenderedDOMComponentsWithTag but expects there to be one result,
 * and returns that one result, or throws exception if there is any other
 * number of matches besides one.
 * @return {!ReactDOMComponent} The one match.
 */
function findRenderedDOMComponentWithTag(root, tagName) {
  validateClassInstance(root, 'findRenderedDOMComponentWithTag');
  const all = scryRenderedDOMComponentsWithTag(root, tagName);
  if (all.length !== 1) {
    throw new Error(
      'Did not find exactly one match (found: ' +
        all.length +
        ') ' +
        'for tag:' +
        tagName,
    );
  }
  return all[0];
}

/**
 * Finds all instances of components with type equal to `componentType`.
 * @return {array} an array of all the matches.
 */
function scryRenderedComponentsWithType(root, componentType) {
  validateClassInstance(root, 'scryRenderedComponentsWithType');
  return findAllInRenderedTree(root, function (inst) {
    return isCompositeComponentWithType(inst, componentType);
  });
}

/**
 * Same as `scryRenderedComponentsWithType` but expects there to be one result
 * and returns that one result, or throws exception if there is any other
 * number of matches besides one.
 * @return {!ReactComponent} The one match.
 */
function findRenderedComponentWithType(root, componentType) {
  validateClassInstance(root, 'findRenderedComponentWithType');
  const all = scryRenderedComponentsWithType(root, componentType);
  if (all.length !== 1) {
    throw new Error(
      'Did not find exactly one match (found: ' +
        all.length +
        ') ' +
        'for componentType:' +
        componentType,
    );
  }
  return all[0];
}

/**
 * Pass a mocked component module to this method to augment it with
 * useful methods that allow it to be used as a dummy React component.
 * Instead of rendering as usual, the component will become a simple
 * <div> containing any provided children.
 *
 * @param {object} module the mock function object exported from a
 *                        module that defines the component to be mocked
 * @param {?string} mockTagName optional dummy root tag name to return
 *                              from render method (overrides
 *                              module.mockTagName if provided)
 * @return {object} the ReactTestUtils object (for chaining)
 */
function mockComponent(module, mockTagName) {
  if (__DEV__) {
    if (!hasWarnedAboutDeprecatedMockComponent) {
      hasWarnedAboutDeprecatedMockComponent = true;
      console.warn(
        'ReactTestUtils.mockComponent() is deprecated. ' +
          'Use shallow rendering or jest.mock() instead.\n\n' +
          'See https://reactjs.org/link/test-utils-mock-component for more information.',
      );
    }
  }

  mockTagName = mockTagName || module.mockTagName || 'div';

  module.prototype.render.mockImplementation(function () {
    return React.createElement(mockTagName, null, this.props.children);
  });

  return this;
}

function nativeTouchData(x, y) {
  return {
    touches: [{pageX: x, pageY: y}],
  };
}

// Start of inline: the below functions were inlined from
// EventPropagator.js, as they deviated from ReactDOM's newer
// implementations.

/**
 * Dispatch the event to the listener.
 * @param {SyntheticEvent} event SyntheticEvent to handle
 * @param {function} listener Application-level callback
 * @param {*} inst Internal component instance
 */
function executeDispatch(event, listener, inst) {
  const type = event.type || 'unknown-event';
  event.currentTarget = getNodeFromInstance(inst);
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
  event.currentTarget = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(event) {
  const dispatchListeners = event._dispatchListeners;
  const dispatchInstances = event._dispatchInstances;
  if (isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
    }
  } else if (dispatchListeners) {
    executeDispatch(event, dispatchListeners, dispatchInstances);
  }
  event._dispatchListeners = null;
  event._dispatchInstances = null;
}

/**
 * Dispatches an event and releases it back into the pool, unless persistent.
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @private
 */
function executeDispatchesAndRelease(event /* ReactSyntheticEvent */) {
  if (event) {
    executeDispatchesInOrder(event);

    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
}

function isInteractive(tag) {
  return (
    tag === 'button' ||
    tag === 'input' ||
    tag === 'select' ||
    tag === 'textarea'
  );
}

function getParent(inst) {
  do {
    inst = inst.return;
    // TODO: If this is a HostRoot we might want to bail out.
    // That is depending on if we want nested subtrees (layers) to bubble
    // events to their parent. We could also go through parentNode on the
    // host node but that wouldn't work for React Native and doesn't let us
    // do the portal feature.
  } while (
    inst &&
    inst.tag !== HostComponent &&
    (!enableHostSingletons ? true : inst.tag !== HostSingleton)
  );
  if (inst) {
    return inst;
  }
  return null;
}

/**
 * Simulates the traversal of a two-phase, capture/bubble event dispatch.
 */
export function traverseTwoPhase(inst, fn, arg) {
  const path = [];
  while (inst) {
    path.push(inst);
    inst = getParent(inst);
  }
  let i;
  for (i = path.length; i-- > 0; ) {
    fn(path[i], 'captured', arg);
  }
  for (i = 0; i < path.length; i++) {
    fn(path[i], 'bubbled', arg);
  }
}

function shouldPreventMouseEvent(name, type, props) {
  switch (name) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
    case 'onMouseEnter':
      return !!(props.disabled && isInteractive(type));
    default:
      return false;
  }
}

/**
 * @param {object} inst The instance, which is the source of events.
 * @param {string} registrationName Name of listener (e.g. `onClick`).
 * @return {?function} The stored callback.
 */
function getListener(inst /* Fiber */, registrationName: string) {
  // TODO: shouldPreventMouseEvent is DOM-specific and definitely should not
  // live here; needs to be moved to a better place soon
  const stateNode = inst.stateNode;
  if (!stateNode) {
    // Work in progress (ex: onload events in incremental mode).
    return null;
  }
  const props = getFiberCurrentPropsFromNode(stateNode);
  if (!props) {
    // Work in progress.
    return null;
  }
  const listener = props[registrationName];
  if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
    return null;
  }

  if (listener && typeof listener !== 'function') {
    throw new Error(
      `Expected \`${registrationName}\` listener to be a function, instead got a value of \`${typeof listener}\` type.`,
    );
  }

  return listener;
}

function listenerAtPhase(inst, event, propagationPhase: PropagationPhases) {
  let registrationName = event._reactName;
  if (propagationPhase === 'captured') {
    registrationName += 'Capture';
  }
  return getListener(inst, registrationName);
}

function accumulateDispatches(inst, ignoredDirection, event) {
  if (inst && event && event._reactName) {
    const registrationName = event._reactName;
    const listener = getListener(inst, registrationName);
    if (listener) {
      if (event._dispatchListeners == null) {
        event._dispatchListeners = [];
      }
      if (event._dispatchInstances == null) {
        event._dispatchInstances = [];
      }
      event._dispatchListeners.push(listener);
      event._dispatchInstances.push(inst);
    }
  }
}

function accumulateDirectionalDispatches(inst, phase, event) {
  if (__DEV__) {
    if (!inst) {
      console.error('Dispatching inst must not be null');
    }
  }
  const listener = listenerAtPhase(inst, event, phase);
  if (listener) {
    if (event._dispatchListeners == null) {
      event._dispatchListeners = [];
    }
    if (event._dispatchInstances == null) {
      event._dispatchInstances = [];
    }
    event._dispatchListeners.push(listener);
    event._dispatchInstances.push(inst);
  }
}

function accumulateDirectDispatchesSingle(event) {
  if (event && event._reactName) {
    accumulateDispatches(event._targetInst, null, event);
  }
}

function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event._reactName) {
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
  }
}

// End of inline

const Simulate = {};

const directDispatchEventTypes = new Set([
  'mouseEnter',
  'mouseLeave',
  'pointerEnter',
  'pointerLeave',
]);

/**
 * Exports:
 *
 * - `Simulate.click(Element)`
 * - `Simulate.mouseMove(Element)`
 * - `Simulate.change(Element)`
 * - ... (All keys from event plugin `eventTypes` objects)
 */
function makeSimulator(eventType) {
  return function (domNode, eventData) {
    if (React.isValidElement(domNode)) {
      throw new Error(
        'TestUtils.Simulate expected a DOM node as the first argument but received ' +
          'a React element. Pass the DOM node you wish to simulate the event on instead. ' +
          'Note that TestUtils.Simulate will not work if you are using shallow rendering.',
      );
    }

    if (isCompositeComponent(domNode)) {
      throw new Error(
        'TestUtils.Simulate expected a DOM node as the first argument but received ' +
          'a component instance. Pass the DOM node you wish to simulate the event on instead.',
      );
    }

    const reactName = 'on' + eventType[0].toUpperCase() + eventType.slice(1);
    const fakeNativeEvent = new Event();
    fakeNativeEvent.target = domNode;
    fakeNativeEvent.type = eventType.toLowerCase();

    const targetInst = getInstanceFromNode(domNode);
    const event = new SyntheticEvent(
      reactName,
      fakeNativeEvent.type,
      targetInst,
      fakeNativeEvent,
      domNode,
    );

    // Since we aren't using pooling, always persist the event. This will make
    // sure it's marked and won't warn when setting additional properties.
    event.persist();
    assign(event, eventData);

    if (directDispatchEventTypes.has(eventType)) {
      accumulateDirectDispatchesSingle(event);
    } else {
      accumulateTwoPhaseDispatchesSingle(event);
    }

    ReactDOM.unstable_batchedUpdates(function () {
      // Normally extractEvent enqueues a state restore, but we'll just always
      // do that since we're by-passing it here.
      enqueueStateRestore(domNode);
      executeDispatchesAndRelease(event);
      rethrowCaughtError();
    });
    restoreStateIfNeeded();
  };
}

// A one-time snapshot with no plans to update. We'll probably want to deprecate Simulate API.
const simulatedEventTypes = [
  'blur',
  'cancel',
  'click',
  'close',
  'contextMenu',
  'copy',
  'cut',
  'auxClick',
  'doubleClick',
  'dragEnd',
  'dragStart',
  'drop',
  'focus',
  'input',
  'invalid',
  'keyDown',
  'keyPress',
  'keyUp',
  'mouseDown',
  'mouseUp',
  'paste',
  'pause',
  'play',
  'pointerCancel',
  'pointerDown',
  'pointerUp',
  'rateChange',
  'reset',
  'resize',
  'seeked',
  'submit',
  'touchCancel',
  'touchEnd',
  'touchStart',
  'volumeChange',
  'drag',
  'dragEnter',
  'dragExit',
  'dragLeave',
  'dragOver',
  'mouseMove',
  'mouseOut',
  'mouseOver',
  'pointerMove',
  'pointerOut',
  'pointerOver',
  'scroll',
  'toggle',
  'touchMove',
  'wheel',
  'abort',
  'animationEnd',
  'animationIteration',
  'animationStart',
  'canPlay',
  'canPlayThrough',
  'durationChange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'gotPointerCapture',
  'load',
  'loadedData',
  'loadedMetadata',
  'loadStart',
  'lostPointerCapture',
  'playing',
  'progress',
  'seeking',
  'stalled',
  'suspend',
  'timeUpdate',
  'transitionEnd',
  'waiting',
  'mouseEnter',
  'mouseLeave',
  'pointerEnter',
  'pointerLeave',
  'change',
  'select',
  'beforeInput',
  'compositionEnd',
  'compositionStart',
  'compositionUpdate',
];
function buildSimulators() {
  simulatedEventTypes.forEach(eventType => {
    Simulate[eventType] = makeSimulator(eventType);
  });
}
buildSimulators();

export {
  renderIntoDocument,
  isElement,
  isElementOfType,
  isDOMComponent,
  isDOMComponentElement,
  isCompositeComponent,
  isCompositeComponentWithType,
  findAllInRenderedTree,
  scryRenderedDOMComponentsWithClass,
  findRenderedDOMComponentWithClass,
  scryRenderedDOMComponentsWithTag,
  findRenderedDOMComponentWithTag,
  scryRenderedComponentsWithType,
  findRenderedComponentWithType,
  mockComponent,
  nativeTouchData,
  Simulate,
  act,
};
