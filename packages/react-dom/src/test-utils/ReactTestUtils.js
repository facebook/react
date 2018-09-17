/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {findCurrentFiberUsingSlowPath} from 'react-reconciler/reflection';
import * as ReactInstanceMap from 'shared/ReactInstanceMap';
import {
  ClassComponent,
  ClassComponentLazy,
  FunctionalComponent,
  FunctionalComponentLazy,
  HostComponent,
  HostText,
} from 'shared/ReactWorkTags';
import SyntheticEvent from 'events/SyntheticEvent';
import invariant from 'shared/invariant';
import lowPriorityWarning from 'shared/lowPriorityWarning';
import {ELEMENT_NODE} from '../shared/HTMLNodeType';
import * as DOMTopLevelEventTypes from '../events/DOMTopLevelEventTypes';

const {findDOMNode} = ReactDOM;
// Keep in sync with ReactDOMUnstableNativeDependencies.js
// and ReactDOM.js:
const [
  getInstanceFromNode,
  /* eslint-disable no-unused-vars */
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
  injectEventPluginsByName,
  /* eslint-enable no-unused-vars */
  eventNameDispatchConfigs,
  accumulateTwoPhaseDispatches,
  accumulateDirectDispatches,
  enqueueStateRestore,
  restoreStateIfNeeded,
  dispatchEvent,
  runEventsInBatch,
] = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events;

function Event(suffix) {}

let hasWarnedAboutDeprecatedMockComponent = false;

/**
 * @class ReactTestUtils
 */

/**
 * Simulates a top level event being dispatched from a raw event that occurred
 * on an `Element` node.
 * @param {number} topLevelType A number from `TopLevelEventTypes`
 * @param {!Element} node The dom to simulate an event occurring on.
 * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
 */
function simulateNativeEventOnNode(topLevelType, node, fakeNativeEvent) {
  fakeNativeEvent.target = node;
  dispatchEvent(topLevelType, fakeNativeEvent);
}

/**
 * Simulates a top level event being dispatched from a raw event that occurred
 * on the `ReactDOMComponent` `comp`.
 * @param {Object} topLevelType A type from `BrowserEventConstants.topLevelTypes`.
 * @param {!ReactDOMComponent} comp
 * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
 */
function simulateNativeEventOnDOMComponent(
  topLevelType,
  comp,
  fakeNativeEvent,
) {
  simulateNativeEventOnNode(topLevelType, findDOMNode(comp), fakeNativeEvent);
}

function findAllInRenderedFiberTreeInternal(fiber, test) {
  if (!fiber) {
    return [];
  }
  const currentParent = findCurrentFiberUsingSlowPath(fiber);
  if (!currentParent) {
    return [];
  }
  let node = currentParent;
  let ret = [];
  while (true) {
    if (
      node.tag === HostComponent ||
      node.tag === HostText ||
      node.tag === ClassComponent ||
      node.tag === ClassComponentLazy ||
      node.tag === FunctionalComponent ||
      node.tag === FunctionalComponentLazy
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
  if (ReactInstanceMap.get(inst)) {
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
const ReactTestUtils = {
  renderIntoDocument: function(element) {
    const div = document.createElement('div');
    // None of our tests actually require attaching the container to the
    // DOM, and doing so creates a mess that we rely on test isolation to
    // clean up, so we're going to stop honoring the name of this method
    // (and probably rename it eventually) if no problems arise.
    // document.documentElement.appendChild(div);
    return ReactDOM.render(element, div);
  },

  isElement: function(element) {
    return React.isValidElement(element);
  },

  isElementOfType: function(inst, convenienceConstructor) {
    return React.isValidElement(inst) && inst.type === convenienceConstructor;
  },

  isDOMComponent: function(inst) {
    return !!(inst && inst.nodeType === ELEMENT_NODE && inst.tagName);
  },

  isDOMComponentElement: function(inst) {
    return !!(inst && React.isValidElement(inst) && !!inst.tagName);
  },

  isCompositeComponent: function(inst) {
    if (ReactTestUtils.isDOMComponent(inst)) {
      // Accessing inst.setState warns; just return false as that'll be what
      // this returns when we have DOM nodes as refs directly
      return false;
    }
    return (
      inst != null &&
      typeof inst.render === 'function' &&
      typeof inst.setState === 'function'
    );
  },

  isCompositeComponentWithType: function(inst, type) {
    if (!ReactTestUtils.isCompositeComponent(inst)) {
      return false;
    }
    const internalInstance = ReactInstanceMap.get(inst);
    const constructor = internalInstance.type;
    return constructor === type;
  },

  findAllInRenderedTree: function(inst, test) {
    validateClassInstance(inst, 'findAllInRenderedTree');
    if (!inst) {
      return [];
    }
    const internalInstance = ReactInstanceMap.get(inst);
    return findAllInRenderedFiberTreeInternal(internalInstance, test);
  },

  /**
   * Finds all instance of components in the rendered tree that are DOM
   * components with the class name matching `className`.
   * @return {array} an array of all the matches.
   */
  scryRenderedDOMComponentsWithClass: function(root, classNames) {
    validateClassInstance(root, 'scryRenderedDOMComponentsWithClass');
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      if (ReactTestUtils.isDOMComponent(inst)) {
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
  },

  /**
   * Like scryRenderedDOMComponentsWithClass but expects there to be one result,
   * and returns that one result, or throws exception if there is any other
   * number of matches besides one.
   * @return {!ReactDOMComponent} The one match.
   */
  findRenderedDOMComponentWithClass: function(root, className) {
    validateClassInstance(root, 'findRenderedDOMComponentWithClass');
    const all = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      root,
      className,
    );
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
  },

  /**
   * Finds all instance of components in the rendered tree that are DOM
   * components with the tag name matching `tagName`.
   * @return {array} an array of all the matches.
   */
  scryRenderedDOMComponentsWithTag: function(root, tagName) {
    validateClassInstance(root, 'scryRenderedDOMComponentsWithTag');
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      return (
        ReactTestUtils.isDOMComponent(inst) &&
        inst.tagName.toUpperCase() === tagName.toUpperCase()
      );
    });
  },

  /**
   * Like scryRenderedDOMComponentsWithTag but expects there to be one result,
   * and returns that one result, or throws exception if there is any other
   * number of matches besides one.
   * @return {!ReactDOMComponent} The one match.
   */
  findRenderedDOMComponentWithTag: function(root, tagName) {
    validateClassInstance(root, 'findRenderedDOMComponentWithTag');
    const all = ReactTestUtils.scryRenderedDOMComponentsWithTag(root, tagName);
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
  },

  /**
   * Finds all instances of components with type equal to `componentType`.
   * @return {array} an array of all the matches.
   */
  scryRenderedComponentsWithType: function(root, componentType) {
    validateClassInstance(root, 'scryRenderedComponentsWithType');
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      return ReactTestUtils.isCompositeComponentWithType(inst, componentType);
    });
  },

  /**
   * Same as `scryRenderedComponentsWithType` but expects there to be one result
   * and returns that one result, or throws exception if there is any other
   * number of matches besides one.
   * @return {!ReactComponent} The one match.
   */
  findRenderedComponentWithType: function(root, componentType) {
    validateClassInstance(root, 'findRenderedComponentWithType');
    const all = ReactTestUtils.scryRenderedComponentsWithType(
      root,
      componentType,
    );
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
  },

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
  mockComponent: function(module, mockTagName) {
    if (!hasWarnedAboutDeprecatedMockComponent) {
      hasWarnedAboutDeprecatedMockComponent = true;
      lowPriorityWarning(
        false,
        'ReactTestUtils.mockComponent() is deprecated. ' +
          'Use shallow rendering or jest.mock() instead.\n\n' +
          'See https://fb.me/test-utils-mock-component for more information.',
      );
    }

    mockTagName = mockTagName || module.mockTagName || 'div';

    module.prototype.render.mockImplementation(function() {
      return React.createElement(mockTagName, null, this.props.children);
    });

    return this;
  },

  nativeTouchData: function(x, y) {
    return {
      touches: [{pageX: x, pageY: y}],
    };
  },

  Simulate: null,
  SimulateNative: {},
};

/**
 * Exports:
 *
 * - `ReactTestUtils.Simulate.click(Element)`
 * - `ReactTestUtils.Simulate.mouseMove(Element)`
 * - `ReactTestUtils.Simulate.change(Element)`
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
      !ReactTestUtils.isCompositeComponent(domNode),
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
      // do that since we we're by-passing it here.
      enqueueStateRestore(domNode);
      runEventsInBatch(event, true);
    });
    restoreStateIfNeeded();
  };
}

function buildSimulators() {
  ReactTestUtils.Simulate = {};

  let eventType;
  for (eventType in eventNameDispatchConfigs) {
    /**
     * @param {!Element|ReactDOMComponent} domComponentOrNode
     * @param {?object} eventData Fake event data to use in SyntheticEvent.
     */
    ReactTestUtils.Simulate[eventType] = makeSimulator(eventType);
  }
}

buildSimulators();

/**
 * Exports:
 *
 * - `ReactTestUtils.SimulateNative.click(Element/ReactDOMComponent)`
 * - `ReactTestUtils.SimulateNative.mouseMove(Element/ReactDOMComponent)`
 * - `ReactTestUtils.SimulateNative.mouseIn/ReactDOMComponent)`
 * - `ReactTestUtils.SimulateNative.mouseOut(Element/ReactDOMComponent)`
 * - ... (All keys from `BrowserEventConstants.topLevelTypes`)
 *
 * Note: Top level event types are a subset of the entire set of handler types
 * (which include a broader set of "synthetic" events). For example, onDragDone
 * is a synthetic event. Except when testing an event plugin or React's event
 * handling code specifically, you probably want to use ReactTestUtils.Simulate
 * to dispatch synthetic events.
 */

function makeNativeSimulator(eventType, topLevelType) {
  return function(domComponentOrNode, nativeEventData) {
    const fakeNativeEvent = new Event(eventType);
    Object.assign(fakeNativeEvent, nativeEventData);
    if (ReactTestUtils.isDOMComponent(domComponentOrNode)) {
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
}

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
  ReactTestUtils.SimulateNative[eventType] = makeNativeSimulator(
    eventType,
    topLevelType,
  );
});

export default ReactTestUtils;
