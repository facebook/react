/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {findCurrentFiberUsingSlowPath} from 'react-reconciler/src/ReactFiberTreeReflection';
import {get as getInstance} from 'shared/ReactInstanceMap';
import {
  ClassComponent,
  FunctionComponent,
  HostComponent,
  HostText,
} from 'react-reconciler/src/ReactWorkTags';
import SyntheticEvent from 'legacy-events/SyntheticEvent';
import invariant from 'shared/invariant';
import {ELEMENT_NODE} from '../shared/HTMLNodeType';
import * as DOMTopLevelEventTypes from '../events/DOMTopLevelEventTypes';
import act from './ReactTestUtilsAct';
import forEachAccumulated from 'legacy-events/forEachAccumulated';
import accumulateInto from 'legacy-events/accumulateInto';
import {enableModernEventSystem} from 'shared/ReactFeatureFlags';
import {
  rethrowCaughtError,
  invokeGuardedCallbackAndCatchFirstError,
} from 'shared/ReactErrorUtils';

const {findDOMNode} = ReactDOM;
// Keep in sync with ReactDOM.js, and ReactTestUtilsAct.js:
const [
  getInstanceFromNode,
  /* eslint-disable no-unused-vars */
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
  injectEventPluginsByName,
  /* eslint-enable no-unused-vars */
  eventNameDispatchConfigs,
  enqueueStateRestore,
  restoreStateIfNeeded,
  dispatchEvent,
  /* eslint-disable no-unused-vars */
  flushPassiveEffects,
  IsThisRendererActing,
  /* eslint-enable no-unused-vars */
] = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events;

function Event(suffix) {}

let hasWarnedAboutDeprecatedMockComponent = false;
let didWarnSimulateNativeDeprecated = false;

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
      node.tag === FunctionComponent
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
  const stringified = '' + inst;
  if (Array.isArray(inst)) {
    received = 'an array';
  } else if (inst && inst.nodeType === ELEMENT_NODE && inst.tagName) {
    received = 'a DOM node';
  } else if (stringified === '[object Object]') {
    received = 'object with keys {' + Object.keys(inst).join(', ') + '}';
  } else {
    received = stringified;
  }
  invariant(
    false,
    '%s(...): the first argument must be a React class instance. ' +
      'Instead received: %s.',
    methodName,
    received,
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
 * Finds all instance of components in the rendered tree that are DOM
 * components with the class name matching `className`.
 * @return {array} an array of all the matches.
 */
function scryRenderedDOMComponentsWithClass(root, classNames) {
  validateClassInstance(root, 'scryRenderedDOMComponentsWithClass');
  return findAllInRenderedTree(root, function(inst) {
    if (isDOMComponent(inst)) {
      let className = inst.className;
      if (typeof className !== 'string') {
        // SVG, probably.
        className = inst.getAttribute('class') || '';
      }
      const classList = className.split(/\s+/);

      if (!Array.isArray(classNames)) {
        invariant(
          classNames !== undefined,
          'TestUtils.scryRenderedDOMComponentsWithClass expects a ' +
            'className as a second argument.',
        );
        classNames = classNames.split(/\s+/);
      }
      return classNames.every(function(name) {
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
 * Finds all instance of components in the rendered tree that are DOM
 * components with the tag name matching `tagName`.
 * @return {array} an array of all the matches.
 */
function scryRenderedDOMComponentsWithTag(root, tagName) {
  validateClassInstance(root, 'scryRenderedDOMComponentsWithTag');
  return findAllInRenderedTree(root, function(inst) {
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
  return findAllInRenderedTree(root, function(inst) {
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
          'See https://fb.me/test-utils-mock-component for more information.',
      );
    }
  }

  mockTagName = mockTagName || module.mockTagName || 'div';

  module.prototype.render.mockImplementation(function() {
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
  if (Array.isArray(dispatchListeners)) {
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
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */
let eventQueue: ?(Array<ReactSyntheticEvent> | ReactSyntheticEvent) = null;

/**
 * Dispatches an event and releases it back into the pool, unless persistent.
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @private
 */
const executeDispatchesAndRelease = function(event: ReactSyntheticEvent) {
  if (event) {
    executeDispatchesInOrder(event);

    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
};

const executeDispatchesAndReleaseTopLevel = function(e) {
  return executeDispatchesAndRelease(e);
};

function runEventsInBatch(
  events: Array<ReactSyntheticEvent> | ReactSyntheticEvent | null,
) {
  if (events !== null) {
    eventQueue = accumulateInto(eventQueue, events);
  }

  // Set `eventQueue` to null before processing it so that we can tell if more
  // events get enqueued while processing.
  const processingEventQueue = eventQueue;
  eventQueue = null;

  if (!processingEventQueue) {
    return;
  }

  forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel);
  invariant(
    !eventQueue,
    'processEventQueue(): Additional events were enqueued while processing ' +
      'an event queue. Support for this has not yet been implemented.',
  );
  // This would be a good time to rethrow if any of the event handlers threw.
  rethrowCaughtError();
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
  } while (inst && inst.tag !== HostComponent);
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
function getListener(inst: Fiber, registrationName: string) {
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
  invariant(
    !listener || typeof listener === 'function',
    'Expected `%s` listener to be a function, instead got a value of `%s` type.',
    registrationName,
    typeof listener,
  );
  return listener;
}

function listenerAtPhase(inst, event, propagationPhase: PropagationPhases) {
  const registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(inst, registrationName);
}

function accumulateDispatches(inst, ignoredDirection, event) {
  if (inst && event && event.dispatchConfig.registrationName) {
    const registrationName = event.dispatchConfig.registrationName;
    const listener = getListener(inst, registrationName);
    if (listener) {
      event._dispatchListeners = accumulateInto(
        event._dispatchListeners,
        listener,
      );
      event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
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
    event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      listener,
    );
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
  }
}

function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event._targetInst, null, event);
  }
}

function accumulateDirectDispatches(events) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle);
}

function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}
// End of inline

const Simulate = {};
let SimulateNative;

/**
 * Exports:
 *
 * - `Simulate.click(Element)`
 * - `Simulate.mouseMove(Element)`
 * - `Simulate.change(Element)`
 * - ... (All keys from event plugin `eventTypes` objects)
 */
function makeSimulator(eventType) {
  return function(domNode, eventData) {
    invariant(
      !React.isValidElement(domNode),
      'TestUtils.Simulate expected a DOM node as the first argument but received ' +
        'a React element. Pass the DOM node you wish to simulate the event on instead. ' +
        'Note that TestUtils.Simulate will not work if you are using shallow rendering.',
    );
    invariant(
      !isCompositeComponent(domNode),
      'TestUtils.Simulate expected a DOM node as the first argument but received ' +
        'a component instance. Pass the DOM node you wish to simulate the event on instead.',
    );

    const dispatchConfig = eventNameDispatchConfigs[eventType];

    const fakeNativeEvent = new Event();
    fakeNativeEvent.target = domNode;
    fakeNativeEvent.type = eventType.toLowerCase();

    // We don't use SyntheticEvent.getPooled in order to not have to worry about
    // properly destroying any properties assigned from `eventData` upon release
    const targetInst = getInstanceFromNode(domNode);
    const event = new SyntheticEvent(
      dispatchConfig,
      targetInst,
      fakeNativeEvent,
      domNode,
    );

    // Since we aren't using pooling, always persist the event. This will make
    // sure it's marked and won't warn when setting additional properties.
    event.persist();
    Object.assign(event, eventData);

    if (dispatchConfig.phasedRegistrationNames) {
      accumulateTwoPhaseDispatches(event);
    } else {
      accumulateDirectDispatches(event);
    }

    ReactDOM.unstable_batchedUpdates(function() {
      // Normally extractEvent enqueues a state restore, but we'll just always
      // do that since we're by-passing it here.
      enqueueStateRestore(domNode);
      runEventsInBatch(event);
    });
    restoreStateIfNeeded();
  };
}

function buildSimulators() {
  let eventType;
  for (eventType in eventNameDispatchConfigs) {
    /**
     * @param {!Element|ReactDOMComponent} domComponentOrNode
     * @param {?object} eventData Fake event data to use in SyntheticEvent.
     */
    Simulate[eventType] = makeSimulator(eventType);
  }
}

buildSimulators();

if (!enableModernEventSystem) {
  SimulateNative = {};

  /**
   * Simulates a top level event being dispatched from a raw event that occurred
   * on an `Element` node.
   * @param {number} topLevelType A number from `TopLevelEventTypes`
   * @param {!Element} node The dom to simulate an event occurring on.
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */
  const simulateNativeEventOnNode = function(
    topLevelType,
    node,
    fakeNativeEvent,
  ) {
    fakeNativeEvent.target = node;
    const PLUGIN_EVENT_SYSTEM = 1;
    dispatchEvent(topLevelType, PLUGIN_EVENT_SYSTEM, null, fakeNativeEvent);
  };

  /**
   * Simulates a top level event being dispatched from a raw event that occurred
   * on the `ReactDOMComponent` `comp`.
   * @param {Object} topLevelType A type from `BrowserEventConstants.topLevelTypes`.
   * @param {!ReactDOMComponent} comp
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */
  const simulateNativeEventOnDOMComponent = function(
    topLevelType,
    comp,
    fakeNativeEvent,
  ) {
    simulateNativeEventOnNode(topLevelType, findDOMNode(comp), fakeNativeEvent);
  };

  /**
   * Exports:
   *
   * - `SimulateNative.click(Element/ReactDOMComponent)`
   * - `SimulateNative.mouseMove(Element/ReactDOMComponent)`
   * - `SimulateNative.mouseIn/ReactDOMComponent)`
   * - `SimulateNative.mouseOut(Element/ReactDOMComponent)`
   * - ... (All keys from `BrowserEventConstants.topLevelTypes`)
   *
   * Note: Top level event types are a subset of the entire set of handler types
   * (which include a broader set of "synthetic" events). For example, onDragDone
   * is a synthetic event. Except when testing an event plugin or React's event
   * handling code specifically, you probably want to use Simulate
   * to dispatch synthetic events.
   */

  const makeNativeSimulator = function(eventType, topLevelType) {
    return function(domComponentOrNode, nativeEventData) {
      if (__DEV__) {
        if (!didWarnSimulateNativeDeprecated) {
          didWarnSimulateNativeDeprecated = true;
          console.warn(
            'ReactTestUtils.SimulateNative is an undocumented API that does not match ' +
              'how the browser dispatches events, and will be removed in a future major ' +
              'version of React. If you rely on it for testing, consider attaching the root ' +
              'DOM container to the document during the test, and then dispatching native browser ' +
              'events by calling `node.dispatchEvent()` on the DOM nodes. Make sure to set ' +
              'the `bubbles` flag to `true` when creating the native browser event.',
          );
        }
      }

      const fakeNativeEvent = new Event(eventType);
      Object.assign(fakeNativeEvent, nativeEventData);
      if (isDOMComponent(domComponentOrNode)) {
        simulateNativeEventOnDOMComponent(
          topLevelType,
          domComponentOrNode,
          fakeNativeEvent,
        );
      } else if (domComponentOrNode.tagName) {
        // Will allow on actual dom nodes.
        simulateNativeEventOnNode(
          topLevelType,
          domComponentOrNode,
          fakeNativeEvent,
        );
      }
    };
  };

  [
    [DOMTopLevelEventTypes.TOP_ABORT, 'abort'],
    [DOMTopLevelEventTypes.TOP_ANIMATION_END, 'animationEnd'],
    [DOMTopLevelEventTypes.TOP_ANIMATION_ITERATION, 'animationIteration'],
    [DOMTopLevelEventTypes.TOP_ANIMATION_START, 'animationStart'],
    [DOMTopLevelEventTypes.TOP_BLUR, 'blur'],
    [DOMTopLevelEventTypes.TOP_CAN_PLAY_THROUGH, 'canPlayThrough'],
    [DOMTopLevelEventTypes.TOP_CAN_PLAY, 'canPlay'],
    [DOMTopLevelEventTypes.TOP_CANCEL, 'cancel'],
    [DOMTopLevelEventTypes.TOP_CHANGE, 'change'],
    [DOMTopLevelEventTypes.TOP_CLICK, 'click'],
    [DOMTopLevelEventTypes.TOP_CLOSE, 'close'],
    [DOMTopLevelEventTypes.TOP_COMPOSITION_END, 'compositionEnd'],
    [DOMTopLevelEventTypes.TOP_COMPOSITION_START, 'compositionStart'],
    [DOMTopLevelEventTypes.TOP_COMPOSITION_UPDATE, 'compositionUpdate'],
    [DOMTopLevelEventTypes.TOP_CONTEXT_MENU, 'contextMenu'],
    [DOMTopLevelEventTypes.TOP_COPY, 'copy'],
    [DOMTopLevelEventTypes.TOP_CUT, 'cut'],
    [DOMTopLevelEventTypes.TOP_DOUBLE_CLICK, 'doubleClick'],
    [DOMTopLevelEventTypes.TOP_DRAG_END, 'dragEnd'],
    [DOMTopLevelEventTypes.TOP_DRAG_ENTER, 'dragEnter'],
    [DOMTopLevelEventTypes.TOP_DRAG_EXIT, 'dragExit'],
    [DOMTopLevelEventTypes.TOP_DRAG_LEAVE, 'dragLeave'],
    [DOMTopLevelEventTypes.TOP_DRAG_OVER, 'dragOver'],
    [DOMTopLevelEventTypes.TOP_DRAG_START, 'dragStart'],
    [DOMTopLevelEventTypes.TOP_DRAG, 'drag'],
    [DOMTopLevelEventTypes.TOP_DROP, 'drop'],
    [DOMTopLevelEventTypes.TOP_DURATION_CHANGE, 'durationChange'],
    [DOMTopLevelEventTypes.TOP_EMPTIED, 'emptied'],
    [DOMTopLevelEventTypes.TOP_ENCRYPTED, 'encrypted'],
    [DOMTopLevelEventTypes.TOP_ENDED, 'ended'],
    [DOMTopLevelEventTypes.TOP_ERROR, 'error'],
    [DOMTopLevelEventTypes.TOP_FOCUS, 'focus'],
    [DOMTopLevelEventTypes.TOP_INPUT, 'input'],
    [DOMTopLevelEventTypes.TOP_KEY_DOWN, 'keyDown'],
    [DOMTopLevelEventTypes.TOP_KEY_PRESS, 'keyPress'],
    [DOMTopLevelEventTypes.TOP_KEY_UP, 'keyUp'],
    [DOMTopLevelEventTypes.TOP_LOAD_START, 'loadStart'],
    [DOMTopLevelEventTypes.TOP_LOAD_START, 'loadStart'],
    [DOMTopLevelEventTypes.TOP_LOAD, 'load'],
    [DOMTopLevelEventTypes.TOP_LOADED_DATA, 'loadedData'],
    [DOMTopLevelEventTypes.TOP_LOADED_METADATA, 'loadedMetadata'],
    [DOMTopLevelEventTypes.TOP_MOUSE_DOWN, 'mouseDown'],
    [DOMTopLevelEventTypes.TOP_MOUSE_MOVE, 'mouseMove'],
    [DOMTopLevelEventTypes.TOP_MOUSE_OUT, 'mouseOut'],
    [DOMTopLevelEventTypes.TOP_MOUSE_OVER, 'mouseOver'],
    [DOMTopLevelEventTypes.TOP_MOUSE_UP, 'mouseUp'],
    [DOMTopLevelEventTypes.TOP_PASTE, 'paste'],
    [DOMTopLevelEventTypes.TOP_PAUSE, 'pause'],
    [DOMTopLevelEventTypes.TOP_PLAY, 'play'],
    [DOMTopLevelEventTypes.TOP_PLAYING, 'playing'],
    [DOMTopLevelEventTypes.TOP_PROGRESS, 'progress'],
    [DOMTopLevelEventTypes.TOP_RATE_CHANGE, 'rateChange'],
    [DOMTopLevelEventTypes.TOP_SCROLL, 'scroll'],
    [DOMTopLevelEventTypes.TOP_SEEKED, 'seeked'],
    [DOMTopLevelEventTypes.TOP_SEEKING, 'seeking'],
    [DOMTopLevelEventTypes.TOP_SELECTION_CHANGE, 'selectionChange'],
    [DOMTopLevelEventTypes.TOP_STALLED, 'stalled'],
    [DOMTopLevelEventTypes.TOP_SUSPEND, 'suspend'],
    [DOMTopLevelEventTypes.TOP_TEXT_INPUT, 'textInput'],
    [DOMTopLevelEventTypes.TOP_TIME_UPDATE, 'timeUpdate'],
    [DOMTopLevelEventTypes.TOP_TOGGLE, 'toggle'],
    [DOMTopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchCancel'],
    [DOMTopLevelEventTypes.TOP_TOUCH_END, 'touchEnd'],
    [DOMTopLevelEventTypes.TOP_TOUCH_MOVE, 'touchMove'],
    [DOMTopLevelEventTypes.TOP_TOUCH_START, 'touchStart'],
    [DOMTopLevelEventTypes.TOP_TRANSITION_END, 'transitionEnd'],
    [DOMTopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumeChange'],
    [DOMTopLevelEventTypes.TOP_WAITING, 'waiting'],
    [DOMTopLevelEventTypes.TOP_WHEEL, 'wheel'],
  ].forEach(([topLevelType, eventType]) => {
    /**
     * @param {!Element|ReactDOMComponent} domComponentOrNode
     * @param {?Event} nativeEventData Fake native event to use in SyntheticEvent.
     */
    SimulateNative[eventType] = makeNativeSimulator(eventType, topLevelType);
  });
}

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
  SimulateNative,
  act,
};
